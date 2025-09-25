console.log('=== SERVER STARTING ===');
console.log('Loading dependencies...');

const express = require('express');
const cors = require('cors');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import configuration files for rate limiting
const BATCH_CONFIG = require('./batch-config');
const MODEL_CONFIG = require('./model-config');
const RateLimiter = require('./rate-limiter');

console.log('Dependencies loaded successfully');
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('PORT:', process.env.PORT);

// Check for required environment variables
if (!process.env.GEMINI_API_KEY || !process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.warn('Warning: Missing required environment variables. API functionality may be limited.');
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase;

// Debug log for environment variables
console.log('SUPABASE_URL:', supabaseUrl ? 'Found (value hidden)' : 'Not found');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'Found (value hidden)' : 'Not found');

if (supabaseUrl && supabaseKey) {
  try {
    console.log('Initializing Supabase client...');
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
    
    // Test Supabase connection
    supabase.from('resume_analyses').select('id').limit(1)
      .then(({ data, error }) => {
        if (error) {
          if (error.code === '42P01') {
            console.error('Error: The resume_analyses table does not exist in Supabase.');
            console.error('Please create the table using the SQL in supabase_schema.sql');
          } else {
            console.error('Error connecting to Supabase:', error);
          }
        } else {
          console.log('Successfully connected to Supabase resume_analyses table');
        }
      });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('Warning: Missing Supabase environment variables. Database functionality will not work.');
}

const app = express();
// Update CORS configuration to allow requests from frontend domain
app.use(cors({
  origin: [
    'https://resume-rank-fontend.onrender.com', 
    'http://localhost:3000', 
    'http://localhost:5001',
    'https://resume-rank.vercel.app',
    'https://resume-rank-git-main.vercel.app',
    'https://resume-rank-git-develop.vercel.app',
    'https://resume-rank-vercel.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize Google Drive API (if credentials available)
let drive;
let oauth2Client;

try {
  const { google } = require('googleapis');
  
  // OAuth 2.0 setup for user authentication

// Debug environment variables
console.log('Environment check:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Found (value hidden)' : 'NOT FOUND');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Found (value hidden)' : 'NOT FOUND');
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || (process.env.NODE_ENV === 'production' 
      ? 'https://resume-rank-vercel.vercel.app/auth/google/callback'
      : 'http://localhost:5000/auth/google/callback')
  );
  console.log('Google OAuth 2.0 client initialized successfully');
} else {
  console.log('Google OAuth 2.0 credentials not found - OAuth authentication will not be available');
  console.log('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
}

  // Initialize Drive API with service account (fallback)
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    drive = google.drive({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}'),
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      }),
    });
  }
} catch (error) {
  console.error('Error initializing Google Drive API:', error);
}

// Use environment variable for API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini API
let genAI;
try {
  if (GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('Gemini API initialized successfully');
    console.log(`Using model: ${MODEL_CONFIG.model}`);
    console.log(`Batch size: ${BATCH_CONFIG.batchSize}, Delay: ${BATCH_CONFIG.delayMs}ms`);
  } else {
    console.warn('Warning: GEMINI_API_KEY not found. Resume analysis will not work.');
  }
} catch (error) {
  console.error('Error initializing Gemini API:', error);
}

// Rate limiting utilities
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Initialize advanced rate limiter
const rateLimiter = new RateLimiter({
  requestsPerMinute: BATCH_CONFIG.requestsPerMinute,
  requestsPerDay: BATCH_CONFIG.requestsPerDay,
  retryDelayMs: BATCH_CONFIG.retryDelayMs
});

// Hard code the parent folder ID
const PARENT_FOLDER_ID = "1iDXkG-Ox2VoBToGX1BipoOjcYSMQQpVF"; // Parent folder containing Data Analyst and Software Engineer subfolders

// Rest of your code remains the same
async function extractFolderId(url) {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function getResumesFromDrive(folderId, accessToken = null) {
  const driveClient = getDriveClient(accessToken);
  
  let allFiles = [];
  let nextPageToken = null;
  
  do {
    const response = await driveClient.files.list({
      q: `'${folderId}' in parents and mimeType='application/pdf'`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: 1000, // Maximum allowed by Google Drive API
      pageToken: nextPageToken
    });
    
    if (response.data.files && response.data.files.length > 0) {
      allFiles = allFiles.concat(response.data.files);
    }
    
    nextPageToken = response.data.nextPageToken;
    
    // Safety check to prevent infinite loops (limit to 10 pages = 10,000 files max)
    if (allFiles.length >= 10000) {
      console.log('Reached maximum file limit of 10,000 files');
      break;
    }
  } while (nextPageToken);
  
  console.log(`Retrieved ${allFiles.length} PDF files from Drive folder`);
  return allFiles;
}

async function downloadAndParseResume(fileId, accessToken = null) {
  const driveClient = getDriveClient(accessToken);
  try {
    const response = await driveClient.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    
    const buffer = Buffer.from(response.data);
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error(`Error parsing PDF for file ${fileId}:`, error);
    throw new Error('Failed to parse PDF');
  }
}

// Batch analyze multiple resumes using Gemini 2.0 Flash
async function analyzeBatchResumes(resumeBatch, jobDescription, weights) {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }

  const model = genAI.getGenerativeModel({ 
    model: MODEL_CONFIG.model,
    generationConfig: {
      ...MODEL_CONFIG.generationConfig,
      maxOutputTokens: 4096,  // Increased for batch processing
    }
  });

  // Create a single prompt for analyzing multiple resumes
  const batchPrompt = `
    You are a professional resume analyzer. I will provide you with ${resumeBatch.length} resumes to analyze against the following job description. For each resume, extract the candidate's name and email address, then provide detailed scores (0-10) for each criterion.

    Job Description:
    ${jobDescription}

    Please analyze each resume and respond with a JSON array containing one object per resume. Each object should have this structure:
    {
      "resumeIndex": number (0, 1, 2, etc.),
      "candidateName": string (extracted name or "No name found"),
      "email": string (extracted email or "No email found"),
      "skillsMatch": number (0-10),
      "experienceRelevance": number (0-10),
      "educationFit": number (0-10),
      "projectImpact": number (0-10),
      "keyStrengths": string[],
      "areasForImprovement": string[],
      "analysis": string
    }

    IMPORTANT: 
    - Use the full 0-10 range for scoring. Be strict and competitive.
    - Only give 9-10 for truly exceptional matches.
    - Give 7-8 for strong matches, 5-6 for average, 3-4 for weak, 0-2 for poor.
    - Respond with a raw JSON array, not wrapped in markdown.

    Here are the resumes to analyze:

    ${resumeBatch.map((resumeData, index) => 
      `Resume ${index} (${resumeData.fileName}):\n${resumeData.resumeText}\n\n---\n`
    ).join('')}
  `;

  try {
    // Enforce rate limits before making API call
    await rateLimiter.enforceRateLimit();
    
    console.log(`Sending batch request to ${MODEL_CONFIG.model} for ${resumeBatch.length} resumes...`);
    
    const result = await model.generateContent(batchPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonText = extractJsonFromText(text);
    const batchAnalyses = JSON.parse(jsonText);
    
    if (!Array.isArray(batchAnalyses)) {
      throw new Error('Expected JSON array response from batch analysis');
    }
    
    // Map results back to original resume data
    return batchAnalyses.map((analysis, index) => {
      const resumeData = resumeBatch[index];
      if (!resumeData) {
        throw new Error(`No resume data found for index ${index}`);
      }
      
      // Calculate total score as average of all criteria
      const totalScore = Math.round(
        (analysis.skillsMatch + analysis.experienceRelevance + 
         analysis.educationFit + analysis.projectImpact) / 4 * 10
      );
      
      return {
        fileName: resumeData.fileName,
        fileId: resumeData.fileId,
        analysis: {
          ...analysis,
          totalScore
        }
      };
    });
    
  } catch (error) {
    console.error('Error in batch analysis:', error);
    
    // Handle rate limit errors with retry
    if (error.message && error.message.includes('429')) {
      console.log(`Rate limit hit for batch, waiting ${BATCH_CONFIG.retryDelayMs / 1000} seconds before retrying...`);
      await delay(BATCH_CONFIG.retryDelayMs);
      
      // Retry the batch analysis once
      try {
        console.log('Retrying batch analysis...');
        const result = await model.generateContent(batchPrompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonText = extractJsonFromText(text);
        const batchAnalyses = JSON.parse(jsonText);
        
        if (!Array.isArray(batchAnalyses)) {
          throw new Error('Expected JSON array response from batch analysis');
        }
        
        return batchAnalyses.map((analysis, index) => {
          const resumeData = resumeBatch[index];
          if (!resumeData) {
            throw new Error(`No resume data found for index ${index}`);
          }
          
          const totalScore = Math.round(
            (analysis.skillsMatch + analysis.experienceRelevance + 
             analysis.educationFit + analysis.projectImpact) / 4 * 10
          );
          
          return {
            fileName: resumeData.fileName,
            fileId: resumeData.fileId,
            analysis: {
              ...analysis,
              totalScore
            }
          };
        });
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }
    
    // Fallback to individual analysis if batch fails
    console.log('Falling back to individual analysis...');
    const individualResults = [];
    
    for (const resumeData of resumeBatch) {
      try {
        const analysis = await analyzeResume(resumeData.resumeText, jobDescription, weights);
        individualResults.push({
          fileName: resumeData.fileName,
          fileId: resumeData.fileId,
          analysis
        });
      } catch (individualError) {
        console.error(`Error analyzing ${resumeData.fileName}:`, individualError);
        individualResults.push({
          fileName: resumeData.fileName,
          fileId: resumeData.fileId,
          error: individualError.message
        });
      }
    }
    
    return individualResults;
  }
}

// Helper function to extract JSON from text (handles markdown formatting)
function extractJsonFromText(text) {
  console.log("Raw response preview:", text.substring(0, 150) + "...");
  
  // If response is wrapped in markdown code block
  const jsonBlockRegex = /```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/;
  const jsonMatch = text.match(jsonBlockRegex);
  
  if (jsonMatch && jsonMatch[1]) {
    console.log("Found JSON in code block");
    return jsonMatch[1];
  }
  
  // If the response contains a JSON array or object
  const jsonArrayRegex = /(\[[\s\S]*?\])/;
  const arrayMatch = text.match(jsonArrayRegex);
  
  if (arrayMatch && arrayMatch[1]) {
    console.log("Found JSON array in text");
    return arrayMatch[1];
  }
  
  const jsonObjectRegex = /(\{[\s\S]*?\})/;
  const objectMatch = text.match(jsonObjectRegex);
  
  if (objectMatch && objectMatch[1]) {
    console.log("Found JSON object in text");
    return objectMatch[1];
  }
  
  // If no JSON patterns match, return the original text
  return text;
}

async function analyzeResume(resumeText, jobDescription, weights) {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }

  const model = genAI.getGenerativeModel({ 
    model: MODEL_CONFIG.model,
    generationConfig: MODEL_CONFIG.generationConfig
  });

  const prompt = `
    You are a professional resume analyzer. First, extract the candidate's name and email address from the resume text. For the name, look for patterns like:
    - "Name:", "Candidate:", or similar labels followed by a name
    - The first non-empty line at the top of the resume
    - A name in the contact section or header
    For the email, look for:
    - "Email:", "E-mail:", "Contact:", followed by an email address
    - Common email patterns like "name@domain.com"
    - Email addresses in contact sections or headers
    
    Then analyze this resume against the following job description and provide detailed scores (0-10) for:
    1. Skills Match: How well do the candidate's technical and soft skills align with the job requirements?
    2. Experience Relevance: How relevant is their work experience to the role?
    3. Education Fit: How well does their educational background match the position?
    4. Project Impact: How impactful and relevant are their projects to the role?
    
    IMPORTANT: Use the full 0-10 range for each score. Be strict and competitive:
    - Only give 9-10 for truly exceptional, perfect matches.
    - Give 7-8 for strong but not perfect matches.
    - Give 5-6 for average or partial matches.
    - Give 3-4 for weak matches.
    - Give 0-2 for poor or missing fit.
    Do NOT cluster all candidates at the top. Make sure scores reflect real differences in fit to the job description, and penalize missing or irrelevant experience, skills, or education.
    
    Also provide:
    - 3 key strengths that make this candidate a good fit
    - Areas for improvement
    - A detailed analysis of the candidate's fit for the role
    
    Job Description:
    ${jobDescription}
    
    Resume Text:
    ${resumeText}
    
    IMPORTANT: Respond with a raw JSON object, not wrapped in markdown code blocks or any other formatting. The JSON should start with { and end with }. The entire response should be valid JSON:
    {
      "candidateName": string (the extracted candidate name, or "No name found" if none found),
      "email": string (the extracted email address, or "No email found" if none found),
      "skillsMatch": number (0-10),
      "experienceRelevance": number (0-10),
      "educationFit": number (0-10),
      "projectImpact": number (0-10),
      "keyStrengths": string[],
      "areasForImprovement": string[],
      "analysis": string
    }
    
    Note: For the name and email fields, make sure to:
    1. Extract the complete name/email if found
    2. Return "No name found" or "No email found" if not found
    3. Do not include any explanatory text, just the value or "No ... found"
  `;

  try {
    // Enforce rate limits before making API call
    await rateLimiter.enforceRateLimit();
    
    console.log(`Sending request to ${MODEL_CONFIG.model}...`);
    const result = await model.generateContent(prompt);
    console.log(`Received response from ${MODEL_CONFIG.model}`);
    const response = await result.response;
    const text = response.text();
    console.log('Parsing response text...');
    console.log('Response text preview:', text.substring(0, 100) + '...');
    
    // Clean the response text to ensure it's valid JSON
    let cleanedText = text;
    
    // Remove markdown code blocks if present
    if (cleanedText.includes("```json")) {
      cleanedText = cleanedText.replace(/```json\s*/, "");
      cleanedText = cleanedText.replace(/\s*```/, "");
      console.log('Removed JSON code blocks');
    } else if (cleanedText.includes("```")) {
      cleanedText = cleanedText.replace(/```\s*/, "");
      cleanedText = cleanedText.replace(/\s*```/, "");
      console.log('Removed generic code blocks');
    }
    
    // Find the first { and last } to extract JSON
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      console.log('Extracted JSON between braces');
    } else {
      console.error('Could not find JSON braces in the response');
      console.log('Full response text:', text);
      throw new Error('Failed to extract JSON from Gemini response - no valid JSON structure found');
    }
    
    console.log('Cleaned JSON text:', cleanedText.substring(0, 100) + '...');
    
    try {
      const parsedJson = JSON.parse(cleanedText);
      console.log('Successfully parsed JSON response with these keys:', Object.keys(parsedJson).join(', '));
      
      // Use weights from parameter or default
      const skillsWeight = weights?.skills ?? 0.35;
      const experienceWeight = weights?.experience ?? 0.35;
      const educationWeight = weights?.education ?? 0.15;
      const projectsWeight = weights?.projects ?? 0.15;
      
      const totalScore = (
        (parsedJson.skillsMatch * skillsWeight) +
        (parsedJson.experienceRelevance * experienceWeight) +
        (parsedJson.educationFit * educationWeight) +
        (parsedJson.projectImpact * projectsWeight)
      ) * 10; // Convert to 0-100 scale
      
      // Round to 1 decimal place
      parsedJson.totalScore = Math.round(totalScore * 10) / 10;
      
      return parsedJson;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Full cleaned response text:', cleanedText);
      throw new Error(`Failed to parse Gemini API response as JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

// New function to analyze multiple resumes in a single API call with fallback
async function analyzeMultipleResumes(resumeBatch, jobDescription, weights, retryCount = 0) {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }

  const model = genAI.getGenerativeModel({ 
    model: MODEL_CONFIG.model,
    generationConfig: MODEL_CONFIG.generationConfig
  });

  // If batch is too large and we've had errors, split it
  if (resumeBatch.length > 2 && retryCount > 0) {
    console.log(`Splitting batch of ${resumeBatch.length} resumes due to previous errors...`);
    const results = [];
    
    // Process in smaller sub-batches
    for (let i = 0; i < resumeBatch.length; i += 2) {
      const subBatch = resumeBatch.slice(i, i + 2);
      console.log(`Processing sub-batch of ${subBatch.length} resumes...`);
      
      try {
        const subResults = await analyzeMultipleResumes(subBatch, jobDescription, weights, 0);
        results.push(...subResults);
        
        // Small delay between sub-batches
        if (i + 2 < resumeBatch.length) {
          await delay(2000);
        }
      } catch (error) {
        console.error(`Sub-batch failed, falling back to individual processing:`, error);
        
        // Fallback to individual processing for this sub-batch
        for (const resume of subBatch) {
          try {
            const individualResult = await analyzeResume(resume.resumeText, jobDescription, weights);
            results.push({
              resumeIndex: results.length + 1,
              fileName: resume.fileName,
              fileId: resume.fileId,
              candidateName: individualResult.candidateName,
              email: individualResult.email,
              skillsMatch: individualResult.skillsMatch,
              experienceRelevance: individualResult.experienceRelevance,
              educationFit: individualResult.educationFit,
              projectImpact: individualResult.projectImpact,
              keyStrengths: individualResult.keyStrengths,
              areasForImprovement: individualResult.areasForImprovement,
              analysis: individualResult.analysis,
              totalScore: individualResult.totalScore
            });
          } catch (individualError) {
            console.error(`Individual processing failed for ${resume.fileName}:`, individualError);
            results.push({
              resumeIndex: results.length + 1,
              fileName: resume.fileName,
              fileId: resume.fileId,
              error: individualError.message
            });
          }
        }
      }
    }
    
    return results;
  }

  // Create a batch prompt for multiple resumes with text optimization
  const resumeSections = resumeBatch.map((resume, index) => {
    // Truncate very long resumes to prevent token overflow (max ~2000 chars per resume)
    let optimizedText = resume.resumeText;
    if (optimizedText.length > 2000) {
      console.log(`Truncating long resume ${resume.fileName} from ${optimizedText.length} to 2000 chars`);
      optimizedText = optimizedText.substring(0, 2000) + "... [truncated]";
    }
    
    return `[RESUME_${index + 1}]\nCandidate: ${resume.fileName}\n${optimizedText}\n[/RESUME_${index + 1}]`;
  }).join('\n\n');

  const prompt = `
    You are a professional resume analyzer. Analyze these ${resumeBatch.length} resumes against the job description and provide detailed scores for each candidate.

    JOB DESCRIPTION:
    ${jobDescription}

    RESUMES TO ANALYZE:
    ${resumeSections}

    For each resume, extract the candidate's name and email address, then provide scores (0-10) for:
    1. Skills Match: How well do the candidate's technical and soft skills align with the job requirements?
    2. Experience Relevance: How relevant is their work experience to the role?
    3. Education Fit: How well does their educational background match the position?
    4. Project Impact: How impactful and relevant are their projects to the role?

    Also provide:
    - Key strengths (max 5 points)
    - Areas for improvement (max 3 points)
    - Brief analysis (2-3 sentences)

    IMPORTANT: Respond with a raw JSON object containing an array of results, not wrapped in markdown code blocks. The JSON should start with { and end with }:
    {
      "results": [
        {
          "resumeIndex": 1,
          "fileName": "resume1.pdf",
          "candidateName": "extracted name or 'No name found'",
          "email": "extracted email or 'No email found'",
          "skillsMatch": number (0-10),
          "experienceRelevance": number (0-10),
          "educationFit": number (0-10),
          "projectImpact": number (0-10),
          "keyStrengths": ["strength1", "strength2", ...],
          "areasForImprovement": ["area1", "area2", ...],
          "analysis": "brief analysis text"
        },
        ...
      ]
    }
  `;

  // Check prompt size to prevent oversized requests
  const promptSize = prompt.length;
  const estimatedTokens = Math.ceil(promptSize / 4); // Rough estimation: 4 chars per token
  console.log(`Prompt size: ${promptSize} chars, estimated tokens: ${estimatedTokens}`);
  
  if (estimatedTokens > 30000) { // Conservative limit for batch processing
    console.warn(`Prompt too large (${estimatedTokens} tokens), splitting batch...`);
    return analyzeMultipleResumes(resumeBatch, jobDescription, weights, retryCount + 1);
  }

  try {
    // Enforce rate limits before making API call
    await rateLimiter.enforceRateLimit();
    
    console.log(`Sending batch request to ${MODEL_CONFIG.model} for ${resumeBatch.length} resumes...`);
    const result = await model.generateContent(prompt);
    console.log(`Received batch response from ${MODEL_CONFIG.model}`);
    const response = await result.response;
    const text = response.text();
    console.log('Parsing batch response text...');
    console.log('Response text preview:', text.substring(0, 200) + '...');
    
    // Clean the response text to ensure it's valid JSON
    let cleanedText = text;
    
    // Remove markdown code blocks if present
    if (cleanedText.includes("```json")) {
      cleanedText = cleanedText.replace(/```json\s*/, "");
      cleanedText = cleanedText.replace(/\s*```/, "");
      console.log('Removed JSON code blocks');
    } else if (cleanedText.includes("```")) {
      cleanedText = cleanedText.replace(/```\s*/, "");
      cleanedText = cleanedText.replace(/\s*```/, "");
      console.log('Removed generic code blocks');
    }
    
    // Find the first { and last } to extract JSON
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      console.log('Extracted JSON between braces');
    } else {
      console.error('Could not find JSON braces in the response');
      console.log('Full response text:', text);
      throw new Error('Failed to extract JSON from Gemini response - no valid JSON structure found');
    }
    
    console.log('Cleaned JSON text:', cleanedText.substring(0, 200) + '...');
    
    try {
      const parsedJson = JSON.parse(cleanedText);
      console.log('Successfully parsed batch JSON response');
      
      if (!parsedJson.results || !Array.isArray(parsedJson.results)) {
        throw new Error('Invalid response format: expected results array');
      }
      
      // Process each result and calculate total scores
      const processedResults = parsedJson.results.map((analysis, index) => {
        // Use weights from parameter or default
        const skillsWeight = weights?.skills ?? 0.35;
        const experienceWeight = weights?.experience ?? 0.35;
        const educationWeight = weights?.education ?? 0.15;
        const projectsWeight = weights?.projects ?? 0.15;
        
        const totalScore = (
          (analysis.skillsMatch * skillsWeight) +
          (analysis.experienceRelevance * experienceWeight) +
          (analysis.educationFit * educationWeight) +
          (analysis.projectImpact * projectsWeight)
        ) * 10; // Convert to 0-100 scale
        
        // Round to 1 decimal place
        analysis.totalScore = Math.round(totalScore * 10) / 10;
        
        // Ensure we have the fileName from our batch
        if (index < resumeBatch.length) {
          analysis.fileName = resumeBatch[index].fileName;
          analysis.fileId = resumeBatch[index].fileId;
        }
        
        return analysis;
      });
      
      return processedResults;
    } catch (parseError) {
      console.error('Error parsing batch JSON response:', parseError);
      console.log('Full cleaned response text:', cleanedText);
      throw new Error(`Failed to parse Gemini API batch response as JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error analyzing resume batch:', error);
    
    // Handle specific error types with retries
    if (error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('Service Unavailable')) {
      if (retryCount < 3) {
        const backoffDelay = Math.pow(2, retryCount) * 5000; // Exponential backoff: 5s, 10s, 20s
        console.log(`API overloaded (503), retrying in ${backoffDelay/1000} seconds... (attempt ${retryCount + 1}/3)`);
        await delay(backoffDelay);
        return analyzeMultipleResumes(resumeBatch, jobDescription, weights, retryCount + 1);
      } else {
        console.log('Max retries reached for 503 errors, falling back to individual processing...');
        
        // Fallback to individual processing
        const results = [];
        for (const resume of resumeBatch) {
          try {
            await delay(2000); // Small delay between individual calls
            const individualResult = await analyzeResume(resume.resumeText, jobDescription, weights);
            results.push({
              resumeIndex: results.length + 1,
              fileName: resume.fileName,
              fileId: resume.fileId,
              candidateName: individualResult.candidateName,
              email: individualResult.email,
              skillsMatch: individualResult.skillsMatch,
              experienceRelevance: individualResult.experienceRelevance,
              educationFit: individualResult.educationFit,
              projectImpact: individualResult.projectImpact,
              keyStrengths: individualResult.keyStrengths,
              areasForImprovement: individualResult.areasForImprovement,
              analysis: individualResult.analysis,
              totalScore: individualResult.totalScore
            });
          } catch (individualError) {
            console.error(`Individual processing failed for ${resume.fileName}:`, individualError);
            results.push({
              resumeIndex: results.length + 1,
              fileName: resume.fileName,
              fileId: resume.fileId,
              error: individualError.message
            });
          }
        }
        return results;
      }
    }
    
    throw error;
  }
}

// Rate-limited batch processing function
async function processResumesInBatches(
  resumes,
  jobDescription,
  weights,
  accessToken,
  batchSize = BATCH_CONFIG.batchSize,
  delayMs = BATCH_CONFIG.delayMs,
  sessionId = null
) {
  const results = [];
  
  console.log(`Starting batch processing of ${resumes.length} resumes`);
  console.log(`Batch size: ${batchSize}, Delay between batches: ${delayMs}ms`);

  // Send initial progress
  if (sessionId) {
    sendProgressUpdate(sessionId, {
      type: 'progress',
      current: 0,
      total: resumes.length,
      currentBatch: 0,
      totalBatches: Math.ceil(resumes.length / batchSize),
      status: 'Starting analysis...'
    });
  }

  for (let i = 0; i < resumes.length; i += batchSize) {
    const batch = resumes.slice(i, i + batchSize);
    const currentBatch = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(resumes.length / batchSize);
    const processedCount = Math.min(i + batchSize, resumes.length);

    console.log(
      `Processing batch ${currentBatch}/${totalBatches} (${batch.length} resumes) - Progress: ${processedCount}/${resumes.length} resumes`
    );

    // Send batch start progress
    if (sessionId) {
      sendProgressUpdate(sessionId, {
        type: 'progress',
        current: i,
        total: resumes.length,
        currentBatch: currentBatch,
        totalBatches: totalBatches,
        status: `Processing batch ${currentBatch} of ${totalBatches}...`
      });
    }

    // Download all resumes in the batch first
    const batchData = [];
    for (const file of batch) {
      try {
        console.log(`Downloading resume: ${file.name}`);
        
        // Send individual resume progress
        if (sessionId) {
          sendProgressUpdate(sessionId, {
            type: 'progress',
            current: i + batchData.length,
            total: resumes.length,
            currentBatch: currentBatch,
            totalBatches: totalBatches,
            currentResume: file.name,
            status: `Downloading resume: ${file.name}`
          });
        }
        
        const resumeText = await downloadAndParseResume(file.id, accessToken);
        batchData.push({
          fileName: file.name,
          fileId: file.id,
          resumeText: resumeText
        });
      } catch (error) {
        console.error(`Error downloading resume ${file.name}:`, error);
        batchData.push({
          fileName: file.name,
          fileId: file.id,
          error: error.message
        });
      }
    }

    // Filter out failed downloads for batch processing
    const validBatchData = batchData.filter(data => !data.error);
    const failedDownloads = batchData.filter(data => data.error);
    
    if (failedDownloads.length > 0) {
      console.log(`${failedDownloads.length} resumes failed to download in this batch`);
    }

    if (validBatchData.length === 0) {
      console.warn('No valid resumes to process in this batch');
      return failedDownloads.map(failed => ({
        fileName: failed.fileName,
        fileId: failed.fileId,
        error: failed.error
      }));
    }

    // Process the entire batch in a single API call
    console.log(`Analyzing batch of ${validBatchData.length} resumes in single API call...`);
    
    // Send analysis start progress
    if (sessionId) {
      sendProgressUpdate(sessionId, {
        type: 'progress',
        current: i,
        total: resumes.length,
        currentBatch: currentBatch,
        totalBatches: totalBatches,
        status: `Analyzing batch ${currentBatch} of ${totalBatches}...`
      });
    }
    
    let batchResults = [];
    
    try {
      const batchAnalysis = await analyzeMultipleResumes(
        validBatchData,
        jobDescription,
        weights
      );
      
      // Process each result for database storage
      const batchPromises = batchAnalysis.map(async (analysis) => {

        // Store the analysis result in Supabase
        if (supabase) {
          try {
            const timestamp = new Date().toISOString();

            // Prepare the record data
            const recordData = {
              job_description: jobDescription,
              resume_name: analysis.fileName,
              resume_id: analysis.fileId,
              skills_match: analysis.skillsMatch,
              experience_relevance: analysis.experienceRelevance,
              education_fit: analysis.educationFit,
              project_impact: analysis.projectImpact,
              key_strengths: analysis.keyStrengths,
              areas_for_improvement: analysis.areasForImprovement,
              total_score: analysis.totalScore,
              analysis_text: analysis.analysis,
              email: analysis.email,
              created_at: timestamp,
            };

            console.log(`Storing analysis for ${analysis.fileName} in Supabase...`);

            // Try to insert the record with clear error logging
            const { data, error } = await supabase
              .from("resume_analyses")
              .insert([recordData]);

            if (error) {
              console.error(`Supabase insertion error for ${analysis.fileName}:`, error.message);

              if (error.code === "42501") {
                console.error(
                  "RLS Policy Error: You need to update the Row Level Security policy in Supabase"
                );
                console.error(
                  "Go to Supabase dashboard > Authentication > Policies and either:"
                );
                console.error(
                  "1. Disable RLS for the resume_analyses table (for development) OR"
                );
                console.error(
                  "2. Create a policy that allows inserts without authentication"
                );
              }

              analysis.stored = false;
              analysis.storeError = error.message;
            } else {
              console.log(`Analysis for ${analysis.fileName} stored successfully`);
              analysis.stored = true;
            }
          } catch (dbError) {
            console.error(`Error with Supabase operation for ${analysis.fileName}:`, dbError);
            analysis.stored = false;
            analysis.storeError = dbError.message;
          }
        }

        return {
          fileName: analysis.fileName,
          fileId: analysis.fileId,
          analysis,
        };
      });

      // Wait for all database operations to complete
      batchResults = await Promise.all(batchPromises);
      
    } catch (error) {
      console.error(`Error analyzing batch of resumes:`, error);

      // Handle rate limiting specifically
      if (error.message && error.message.includes("rate limit") || error.message.includes("429")) {
        console.log(
          `Rate limit hit for batch, waiting ${
            BATCH_CONFIG.retryDelayMs / 1000
          } seconds before retrying...`
        );
        await delay(BATCH_CONFIG.retryDelayMs);
      }

      // Return error results for all resumes in this batch that couldn't be processed
      batchResults = validBatchData.map(data => ({
        fileName: data.fileName,
        fileId: data.fileId,
        error: error.message,
      }));
    }

    // Combine successful batch results with failed downloads
    const allResults = [
      ...batchResults,
      ...failedDownloads.map(failed => ({
        fileName: failed.fileName,
        fileId: failed.fileId,
        error: failed.error
      }))
    ];

    // Add all results from this batch to the main results array
    results.push(...allResults);

    // Send batch completion progress
    if (sessionId) {
      sendProgressUpdate(sessionId, {
        type: 'progress',
        current: Math.min(i + batchSize, resumes.length),
        total: resumes.length,
        currentBatch: currentBatch,
        totalBatches: totalBatches,
        status: `Completed batch ${currentBatch} of ${totalBatches}`
      });
    }

    // Add delay between batches (except for the last batch)
    if (i + batchSize < resumes.length) {
      console.log(`Waiting ${delayMs}ms before next batch...`);
      await delay(delayMs);
    }
  }

  console.log(`Batch processing completed. Processed ${results.length} resumes.`);
  
  // Send final progress update
  if (sessionId) {
    sendProgressUpdate(sessionId, {
      type: 'progress',
      current: resumes.length,
      total: resumes.length,
      currentBatch: Math.ceil(resumes.length / batchSize),
      totalBatches: Math.ceil(resumes.length / batchSize),
      status: 'Analysis complete!'
    });
  }
  
  // Log summary statistics
  const successful = results.filter(r => r.analysis && !r.error).length;
  const failed = results.filter(r => r.error).length;
  const stored = results.filter(r => r.analysis && r.analysis.stored).length;
  
  console.log(`Summary: ${successful} successful, ${failed} failed, ${stored} stored in database`);

  return results;
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { jobDescription, driveFolderLink, experienceLevel, scoringLogic, weights, accessToken, sessionId } = req.body;
    console.log('Received analysis request with job description length:', jobDescription?.length);
    console.log('Drive folder link:', driveFolderLink);
    console.log('Using OAuth access token:', accessToken ? 'Yes' : 'No');
    
    // Check if Gemini API is initialized
    if (!genAI) {
      throw new Error('Gemini API not initialized');
    }
    
    // Use the real Gemini API since we have a working key
    console.log('Gemini API is available, using it for analysis');
    
    const folderId = await extractFolderId(driveFolderLink);
    if (!folderId) {
      throw new Error('Invalid Drive folder link');
    }
    
    let resumes = [];
    try {
      resumes = await getResumesFromDrive(folderId, accessToken);
      console.log(`Found ${resumes.length} resumes in the folder`);
    } catch (error) {
      console.error('Error getting resumes from Drive:', error);
      throw new Error('Error accessing Google Drive: ' + error.message);
    }
    
    if (resumes.length === 0) {
      throw new Error('No PDF resumes found in the Drive folder');
    }
    
    console.log(`Analyzing ${resumes.length} resumes using rate-limited batch processing...`);
    console.log(`Configuration: ${BATCH_CONFIG.batchSize} resumes per batch, ${BATCH_CONFIG.delayMs}ms delay between batches`);
    
    // Process resumes using the new rate-limited batch function
    const results = await processResumesInBatches(
      resumes,
      jobDescription,
      weights,
      accessToken,
      BATCH_CONFIG.batchSize,
      BATCH_CONFIG.delayMs,
      sessionId
    );
    
    // Sort results by totalScore (descending)
    results.sort((a, b) => {
      // Check if both have valid analysis and scores
      if (a.analysis?.totalScore !== undefined && b.analysis?.totalScore !== undefined) {
        return b.analysis.totalScore - a.analysis.totalScore;
      } else if (a.analysis?.totalScore !== undefined) {
        return -1; // a has score, b doesn't - a comes first
      } else if (b.analysis?.totalScore !== undefined) {
        return 1;  // b has score, a doesn't - b comes first
      }
      // Both have errors or no score, keep original order
      return 0;
    });
    
    console.log('Analysis complete, sending response');
    
    // Close progress stream
    if (sessionId) {
      closeProgressStream(sessionId);
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// n8n API endpoints
app.post('/api/n8n/create-calendar-events', async (req, res) => {
  try {
    const { events } = req.body;
    console.log('Events being sent to n8n:', JSON.stringify(events, null, 2));
    
    // Call n8n webhook for calendar events
    const response = await fetch(process.env.N8N_CALENDAR_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar events');
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error creating calendar events:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/n8n/send-rejection-emails', async (req, res) => {
  try {
    const { recipients, subject, body } = req.body;
    
    // Call n8n webhook for sending emails
    const response = await fetch(process.env.N8N_EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipients, subject, body }),
    });

    if (!response.ok) {
      throw new Error('Failed to send rejection emails');
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error sending rejection emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ 
    status: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    oauth2Client: oauth2Client ? 'Initialized' : 'Not initialized'
  });
});

// Add a simple health check
app.get('/api/health', (req, res) => {
  console.log('Health check called');
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Save a job result
app.post('/api/save-job', async (req, res) => {
  const { jobTitle, results } = req.body;
  if (!jobTitle || !results) {
    return res.status(400).json({ error: 'Missing jobTitle or results' });
  }
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert([{ job_title: jobTitle, results }])
      .select();
    if (error) throw error;
    res.json({ success: true, job: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all saved jobs
app.get('/api/saved-jobs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id, job_title, created_at');
    if (error) throw error;
    res.json({ jobs: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single saved job by ID
app.get('/api/saved-jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id, job_title, created_at, results')
      .eq('id', id)
      .single();
    if (error) throw error;
    res.json({ job: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a saved job by ID
app.delete('/api/saved-jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('Fetching dashboard stats...');
    
    // Get total analyses count from resume_analyses
    const { count: totalAnalyses, error: countError } = await supabase
      .from('resume_analyses')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting analyses:', countError);
      throw countError;
    }
    
    console.log('Total analyses count:', totalAnalyses);

    // Get unique candidates count from resume_analyses
    const { data: candidates, error: candidatesError } = await supabase
      .from('resume_analyses')
      .select('resume_id');
    
    if (candidatesError) throw candidatesError;
    
    const uniqueCandidates = new Set(candidates.map(c => c.resume_id)).size;

    // Get average total score from resume_analyses
    const { data: scores, error: scoresError } = await supabase
      .from('resume_analyses')
      .select('total_score');
    
    if (scoresError) throw scoresError;
    
    const avgMatchScore = scores.length > 0 
      ? Math.round((scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length) * 10) / 10
      : 0;

    // Get active jobs (unique job descriptions) from resume_analyses
    const { data: jobs, error: jobsError } = await supabase
      .from('resume_analyses')
      .select('job_description');
    
    if (jobsError) throw jobsError;
    
    const uniqueJobs = new Set(jobs.map(j => j.job_description)).size;

    const stats = {
      totalAnalyses: totalAnalyses || 0,
      candidatesReviewed: uniqueCandidates,
      avgMatchScore: avgMatchScore,
      activeJobs: uniqueJobs
    };
    
    console.log('Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/dashboard/recent', async (req, res) => {
  try {
    console.log('Fetching recent analyses...');
    
    // Get recent analyses from resume_analyses table
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('job_description, resume_name, total_score, created_at')
      .order('created_at', { ascending: false })
      .limit(50); // Get last 50 analyses to group by job

    if (error) {
      console.error('Error fetching recent analyses:', error);
      throw error;
    }
    
    console.log('Raw analyses data count:', data?.length || 0);

    // Group by job description and calculate stats
    const jobGroups = {};
    data.forEach(analysis => {
      if (!jobGroups[analysis.job_description]) {
        jobGroups[analysis.job_description] = {
          job_description: analysis.job_description,
          candidates: [],
          total_score: 0,
          count: 0,
          latest_date: analysis.created_at
        };
      }
      jobGroups[analysis.job_description].candidates.push(analysis.resume_name);
      jobGroups[analysis.job_description].total_score += analysis.total_score;
      jobGroups[analysis.job_description].count += 1;
    });

    // Also get data from saved_jobs table
    const { data: savedJobs, error: savedJobsError } = await supabase
      .from('saved_jobs')
      .select('job_title, results, created_at')
      .order('created_at', { ascending: false });

    if (!savedJobsError && savedJobs) {
      savedJobs.forEach(job => {
        if (job.results && job.results.results) {
          const candidateCount = job.results.results.length;
          const scores = job.results.results
            .filter(r => r.analysis && r.analysis.totalScore)
            .map(r => r.analysis.totalScore);
          
          const avgScore = scores.length > 0 
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
            : 0;

          jobGroups[job.job_title] = {
            job_description: job.job_title,
            candidates: [],
            total_score: avgScore * candidateCount,
            count: candidateCount,
            latest_date: job.created_at
          };
        }
      });
    }

    // Convert to array and calculate averages
    const recentAnalyses = Object.values(jobGroups).map(group => ({
      id: group.job_description.substring(0, 20) + '...', // Use truncated job description as ID
      title: group.job_description.substring(0, 50) + (group.job_description.length > 50 ? '...' : ''),
      candidates: group.count,
      avgScore: Math.round((group.total_score / group.count) * 10) / 10,
      status: 'completed',
      date: formatTimeAgo(group.latest_date),
      rawDate: group.latest_date // Keep original date for sorting
    }));

    // Sort by latest date and take top 5
    recentAnalyses.sort((a, b) => {
      const dateA = new Date(a.rawDate);
      const dateB = new Date(b.rawDate);
      return dateB - dateA;
    });
    
    const result = { analyses: recentAnalyses.slice(0, 5) };
    console.log('Recent analyses result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
  if (diffInHours < 48) return '1 day ago';
  return `${Math.floor(diffInHours / 24)} days ago`;
}

// Add new endpoint to fetch subfolders
app.get('/api/drive-folders', async (req, res) => {
  try {
    if (!drive) {
      throw new Error('Google Drive API not initialized');
    }

    const response = await drive.files.list({
      q: `'${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    res.json(response.data.files);
  } catch (error) {
    console.error('Error fetching subfolders:', error);
    res.status(500).json({ error: 'Failed to fetch subfolders' });
  }
});

// Google OAuth routes
app.get('/auth/google', (req, res) => {
  if (!oauth2Client) {
    return res.status(500).json({ error: 'Google OAuth is not configured' });
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  if (!oauth2Client) {
    return res.status(500).json({ error: 'Google OAuth is not configured' });
  }
  
  const { code } = req.query;
  
  try {
    console.log('Processing OAuth callback with code...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Redirect back to frontend with tokens in URL (for demo purposes)
    // In production, you'd want to store these securely on the server
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://resume-rank-vercel.vercel.app'
      : 'http://localhost:5001';
    const redirectUrl = `${baseUrl}/analysis?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token || ''}&oauth_success=true`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error getting tokens:', error);
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://resume-rank-vercel.vercel.app'
      : 'http://localhost:5001';
    const errorRedirectUrl = `${baseUrl}/analysis?error=${encodeURIComponent('Failed to authorize Google Drive access')}`;
    res.redirect(errorRedirectUrl);
  }
});

// Exchange code for tokens (called by frontend)
app.post('/auth/google/exchange', async (req, res) => {
  if (!oauth2Client) {
    return res.status(500).json({ error: 'Google OAuth is not configured' });
  }
  
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }
  
  try {
    console.log('Attempting to exchange code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Successfully obtained tokens');
    
    oauth2Client.setCredentials(tokens);
    
    res.json({ 
      success: true, 
      message: 'Google Drive access authorized successfully',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    
    // Provide more specific error messages
    if (error.message && error.message.includes('invalid_grant')) {
      res.status(400).json({ 
        error: 'Authorization code has expired or already been used. Please try connecting again.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to authorize Google Drive access: ' + error.message 
      });
    }
  }
});

// Helper function to get Drive client with user's OAuth tokens
function getDriveClient(accessToken) {
  const { google } = require('googleapis');
  
  if (accessToken) {
    // Use user's OAuth tokens
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
  } else if (drive) {
    // Fallback to service account
    return drive;
  } else {
    throw new Error('No Google Drive authentication available');
  }
}

const PORT = process.env.PORT || 5000;

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Load payment, webhook, and progress routes
const paymentRoutes = require('./api/payment');
const webhookRoutes = require('./api/webhook');
const { router: progressRoutes, sendProgressUpdate, closeProgressStream } = require('./api/progress');

// Mount the routes
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/progress', progressRoutes);

// Export for Vercel serverless functions
module.exports = app; 