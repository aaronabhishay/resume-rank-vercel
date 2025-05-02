const cors = require('cors');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');

// Middleware to handle CORS
const corsMiddleware = cors({
  origin: '*', // Allow all origins for now
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

// Helper function to extract folder ID from Drive link
async function extractFolderId(url) {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Helper function to get resumes from Google Drive
async function getResumesFromDrive(folderId, drive) {
  if (!drive) {
    throw new Error('Google Drive API not initialized');
  }
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/pdf'`,
    fields: 'files(id, name)',
  });
  return response.data.files;
}

// Helper function to download and parse resume from Drive
async function downloadAndParseResume(fileId, drive) {
  if (!drive) {
    throw new Error('Google Drive API not initialized');
  }
  try {
    const response = await drive.files.get(
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

// Helper function to analyze resume using Gemini API
async function analyzeResume(resumeText, jobDescription, genAI) {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }
  
  // Create the Gemini 1.5 Flash model with optimal configuration
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  });
  
  const prompt = `
    You are a professional resume analyzer. Analyze this resume against the following job description and provide detailed scores (0-10) for:
    
    1. Skills Match: How well do the candidate's technical and soft skills align with the job requirements?
    2. Experience Relevance: How relevant is their work experience to the role?
    3. Education Fit: How well does their educational background match the position?
    4. Project Impact: How impactful and relevant are their projects to the role?
    
    Also provide:
    - 3 key strengths that make this candidate a good fit
    - Areas for improvement
    - Overall match percentage (still on a scale of 0-100)
    
    Job Description:
    ${jobDescription}
    
    Resume Text:
    ${resumeText}
    
    IMPORTANT: Respond with a raw JSON object, not wrapped in markdown code blocks or any other formatting. The JSON should start with { and end with }. The entire response should be valid JSON:
    {
      "skillsMatch": number (0-10),
      "experienceRelevance": number (0-10),
      "educationFit": number (0-10),
      "projectImpact": number (0-10),
      "keyStrengths": string[],
      "areasForImprovement": string[],
      "totalScore": number (0-100),
      "analysis": string
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response text to ensure it's valid JSON
    let cleanedText = text;
    
    // Remove markdown code blocks if present
    if (cleanedText.includes("```json")) {
      cleanedText = cleanedText.replace(/```json\s*/, "");
      cleanedText = cleanedText.replace(/\s*```/, "");
    } else if (cleanedText.includes("```")) {
      cleanedText = cleanedText.replace(/```\s*/, "");
      cleanedText = cleanedText.replace(/\s*```/, "");
    }
    
    // Find the first { and last } to extract JSON
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    } else {
      throw new Error('Failed to extract JSON from Gemini response - no valid JSON structure found');
    }
    
    try {
      const parsedJson = JSON.parse(cleanedText);
      return parsedJson;
    } catch (parseError) {
      throw new Error(`Failed to parse Gemini API response as JSON: ${parseError.message}`);
    }
  } catch (error) {
    throw error;
  }
}

// Main handler for the serverless function
module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Apply CORS for regular requests
  return corsMiddleware(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const { jobDescription, driveFolderLink } = req.body;

      if (!jobDescription || !driveFolderLink) {
        return res.status(400).json({ error: 'Missing required fields: jobDescription and driveFolderLink' });
      }

      // Get API keys from environment variables
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;

      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      if (!GOOGLE_SERVICE_ACCOUNT) {
        return res.status(500).json({ error: 'Google Service Account not configured' });
      }

      // Initialize Gemini API
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

      // Initialize Google Drive API
      let drive;
      try {
        drive = google.drive({
          version: 'v3',
          auth: new google.auth.GoogleAuth({
            credentials: JSON.parse(GOOGLE_SERVICE_ACCOUNT || '{}'),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
          }),
        });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to initialize Google Drive API: ' + error.message });
      }
      
      // Process the drive folder link to get folder ID
      const folderId = await extractFolderId(driveFolderLink);
      if (!folderId) {
        return res.status(400).json({ error: 'Invalid Google Drive folder link' });
      }
      
      // Get the PDF files from the folder
      const files = await getResumesFromDrive(folderId, drive);
      
      if (files.length === 0) {
        return res.status(404).json({ error: 'No PDF files found in the specified folder' });
      }
      
      // Process each resume
      const results = [];
      for (const file of files) {
        try {
          // Parse the resume
          const resumeText = await downloadAndParseResume(file.id, drive);
          
          // Analyze the resume
          const analysis = await analyzeResume(resumeText, jobDescription, genAI);
          
          // Add to results
          results.push({
            fileName: file.name,
            ...analysis
          });
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          results.push({
            fileName: file.name,
            error: error.message || 'Unknown error',
            success: false
          });
        }
      }
      
      // Sort results by score (highest first)
      results.sort((a, b) => {
        if (a.totalScore === undefined) return 1;
        if (b.totalScore === undefined) return -1;
        return b.totalScore - a.totalScore;
      });
      
      return res.status(200).json(results);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
}; 