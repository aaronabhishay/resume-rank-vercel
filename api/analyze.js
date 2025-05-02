const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// CORS middleware
const corsMiddleware = cors({
  origin: '*', // Or specify your frontend domain
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Middleware handler
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Initialize Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDI9q8l80wS6-eZ1APIF9B3ohRmeXEZyrE";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Mock resume analysis function (replace with real implementation)
async function analyzeResume(resumeText, jobDescription) {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }
  
  console.log('Creating Gemini 1.5 Flash model...');
  
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
      throw new Error('Failed to extract JSON from Gemini response');
    }
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

// For mock data
function generateMockAnalysis() {
  return {
    skillsMatch: Math.floor(Math.random() * 10) + 1,
    experienceRelevance: Math.floor(Math.random() * 10) + 1,
    educationFit: Math.floor(Math.random() * 10) + 1,
    projectImpact: Math.floor(Math.random() * 10) + 1,
    keyStrengths: [
      "Strong technical background in required technologies",
      "Relevant industry experience",
      "Demonstrated leadership abilities"
    ],
    areasForImprovement: [
      "Could benefit from more experience with specific tools",
      "Limited international work experience",
      "Few examples of quantifiable achievements"
    ],
    totalScore: Math.floor(Math.random() * 100) + 1,
    analysis: "This candidate shows promise but has some areas for growth..."
  };
}

module.exports = async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    await runMiddleware(req, res, corsMiddleware);
    return res.status(200).end();
  }

  // Apply CORS middleware
  await runMiddleware(req, res, corsMiddleware);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobDescription, driveFolderLink, useMockData } = req.body;
    
    // Validate request data
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    if (!driveFolderLink) {
      return res.status(400).json({ error: 'Google Drive folder link is required' });
    }

    // Only use mock data if explicitly requested
    if (useMockData === true) {
      console.log('Using mock data for analysis (explicitly requested)');
      const candidates = Array.from({ length: 5 }, (_, i) => ({
        id: `candidate-${i + 1}`,
        name: `Candidate ${i + 1}`,
        ...generateMockAnalysis()
      }));
      
      return res.status(200).json({ candidates });
    }
    
    try {
      // Extract the folder ID from the link
      const folderId = await extractFolderId(driveFolderLink);
      if (!folderId) {
        return res.status(400).json({ 
          error: 'Invalid Google Drive folder link. Make sure it contains "folders/" followed by the folder ID.' 
        });
      }
      
      // Get all PDF files from the folder
      const resumeFiles = await getResumesFromDrive(folderId);
      if (!resumeFiles || resumeFiles.length === 0) {
        return res.status(404).json({ 
          error: 'No PDF files found in the specified Google Drive folder.' 
        });
      }
      
      console.log(`Found ${resumeFiles.length} resume files to analyze`);
      
      // Process each resume
      const candidatesPromises = resumeFiles.map(async (file) => {
        try {
          // Download and parse PDF
          const resumeText = await downloadAndParseResume(file.id);
          
          // Analyze the resume text
          const analysis = await analyzeResume(resumeText, jobDescription);
          
          return {
            id: file.id,
            name: file.name.replace('.pdf', ''),
            ...analysis
          };
        } catch (error) {
          console.error(`Error processing resume ${file.name}:`, error);
          return {
            id: file.id,
            name: file.name.replace('.pdf', ''),
            error: true,
            message: error.message
          };
        }
      });
      
      const candidates = await Promise.all(candidatesPromises);
      
      // Sort candidates by total score (descending)
      candidates.sort((a, b) => {
        if (a.error) return 1;  // Put errors at the end
        if (b.error) return -1;
        return b.totalScore - a.totalScore;
      });
      
      res.status(200).json({ candidates });
    } catch (error) {
      console.error('Error processing resumes:', error);
      
      // If a critical error occurs, fall back to mock data but with an error message
      if (error.message.includes('Google Drive API not initialized') || 
          error.message.includes('Failed to extract JSON from Gemini response') ||
          error.message.includes('Gemini API not initialized')) {
        
        console.log('API service unavailable, using mock data as fallback');
        const candidates = Array.from({ length: 5 }, (_, i) => ({
          id: `candidate-${i + 1}`,
          name: `Candidate ${i + 1}`,
          ...generateMockAnalysis()
        }));
        
        return res.status(200).json({ 
          candidates,
          warning: `Using mock data due to service limitation: ${error.message}`
        });
      }
      
      throw error; // Re-throw for other errors
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}; 