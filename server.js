const express = require('express');
const cors = require('cors');
const pdf = require('pdf-parse');
require('dotenv').config();

// Check for required environment variables
if (!process.env.GEMINI_API_KEY || !process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.warn('Warning: Missing required environment variables. API functionality may be limited.');
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Drive API (if credentials available)
let drive;
try {
  const { google } = require('googleapis');
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

// Hard code the API key for testing (better to use env variables in production)
const GEMINI_API_KEY = "AIzaSyDI9q8l80wS6-eZ1APIF9B3ohRmeXEZyrE";

// Initialize Gemini API with the working key
let genAI;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('Gemini API initialized successfully with direct key');
} catch (error) {
  console.error('Error initializing Gemini API:', error);
}

// Rest of your code remains the same
async function extractFolderId(url) {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function getResumesFromDrive(folderId) {
  if (!drive) {
    throw new Error('Google Drive API not initialized');
  }
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/pdf'`,
    fields: 'files(id, name)',
  });
  return response.data.files;
}

async function downloadAndParseResume(fileId) {
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

async function analyzeResume(resumeText, jobDescription) {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }
  
  console.log('Creating Gemini 1.5 Flash model...');
  
  // Create the Gemini 1.5 Flash model with optimal configuration
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",  // Using the faster, more cost-effective model
    // Optional configuration parameters
    generationConfig: {
      temperature: 0.4,         // Lower temperature for more consistent results
      topP: 0.8,                // Controls diversity of responses
      topK: 40,                 // Another parameter for controlling diversity
      maxOutputTokens: 2048,    // Limit the response length
    }
  });
  
  console.log('Successfully created gemini-1.5-flash model');
  
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
    console.log('Sending request to Gemini 1.5 Flash...');
    const result = await model.generateContent(prompt);
    console.log('Received response from Gemini 1.5 Flash');
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
      return parsedJson;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Full cleaned response text:', cleanedText);
      throw new Error(`Failed to parse Gemini API response as JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    // Don't catch and wrap the error - let it bubble up with its original message
    throw error;
  }
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { jobDescription, driveFolderLink } = req.body;
    console.log('Received analysis request with job description length:', jobDescription?.length);
    console.log('Drive folder link:', driveFolderLink);
    
    // Check if Gemini API is initialized
    if (!genAI) {
      throw new Error('Gemini API not initialized');
    }
    
    // Use the real Gemini API since we have a working key
    console.log('Gemini API is available, using it for analysis');
    
    const results = [];
    
    try {
      // Extract folder ID from the Drive link
      const folderId = await extractFolderId(driveFolderLink);
      if (!folderId) {
        throw new Error('Invalid Google Drive folder link');
      }
      
      console.log('Extracted folder ID:', folderId);
      
      // Get list of resume PDFs from the Drive folder
      const files = await getResumesFromDrive(folderId);
      console.log(`Found ${files.length} files in Drive folder`);
      
      if (files.length === 0) {
        throw new Error('No PDF files found in the specified Drive folder');
      }
      
      // Process each resume
      for (const file of files) {
        try {
          console.log(`Processing resume: ${file.name}`);
          
          // Extract text from the PDF
          const resumeText = await downloadAndParseResume(file.id);
          
          // Extract email from filename or default to a placeholder
          const emailMatch = file.name.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
          const email = emailMatch ? emailMatch[1] : 'email@example.com';
          
          // Extract name from filename (remove extension and use as name)
          const name = file.name.replace(/\.[^/.]+$/, "");
          
          console.log(`Analyzing resume for ${name}...`);
          
          // Analyze the resume using Gemini API
          const analysis = await analyzeResume(resumeText, jobDescription);
          console.log(`Analysis complete for ${name}`);
          
          results.push({
            name,
            email,
            ...analysis
          });
        } catch (error) {
          console.error(`Error processing resume ${file.name}:`, error);
          
          // Return the actual error with detailed information
          results.push({
            name: file.name.replace(/\.[^/.]+$/, ""),
            email: 'error@example.com',
            error: true,
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack,
            analysis: `ERROR: ${error.message}`
          });
        }
      }
    } catch (error) {
      console.error('Error accessing Drive folder:', error);
      throw new Error(`Failed to access Drive folder: ${error.message}`);
    }

    // Sort results by totalScore in descending order (errors at the bottom)
    results.sort((a, b) => {
      if (a.error && !b.error) return 1;
      if (!a.error && b.error) return -1;
      return b.totalScore - a.totalScore;
    });
    
    console.log('Sending results to client');
    res.json(results);
  } catch (error) {
    console.error('Error:', error);
    
    // Return the error instead of mock data
    res.status(500).json({
      error: true,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'API is working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 