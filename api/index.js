const express = require('express');
const cors = require('cors');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// CORS configuration for Vercel deployment
app.use(cors({
  origin: ['https://resume-rank-fontend.onrender.com', 'http://localhost:3000', 'http://localhost:5001', 'https://*.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Initialize Google Drive API
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

// Initialize Gemini API
let genAI;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDI9q8l80wS6-eZ1APIF9B3ohRmeXEZyrE";
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('Gemini API initialized successfully');
} catch (error) {
  console.error('Error initializing Gemini API:', error);
}

// Hard code the parent folder ID
const PARENT_FOLDER_ID = "1iDXkG-Ox2VoBToGX1BipoOjcYSMQQpVF";

// Helper functions
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

async function analyzeResume(resumeText, jobDescription, weights) {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
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
      
      return {
        ...parsedJson,
        totalScore: Math.round(totalScore * 100) / 100
      };
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Failed JSON text:', cleanedText);
      throw new Error('Failed to parse JSON response from Gemini');
    }
  } catch (error) {
    console.error('Error in analyzeResume:', error);
    throw error;
  }
}

// API Routes
app.post('/api/analyze-resumes', async (req, res) => {
  try {
    const { folderUrl, jobDescription, weights } = req.body;
    
    if (!folderUrl || !jobDescription) {
      return res.status(400).json({ error: 'Folder URL and job description are required' });
    }

    const folderId = await extractFolderId(folderUrl);
    if (!folderId) {
      return res.status(400).json({ error: 'Invalid Google Drive folder URL' });
    }

    const files = await getResumesFromDrive(folderId);
    if (!files || files.length === 0) {
      return res.json({ results: [], message: 'No PDF files found in the folder' });
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        const resumeText = await downloadAndParseResume(file.id);
        const analysis = await analyzeResume(resumeText, jobDescription, weights);
        
        results.push({
          fileName: file.name,
          fileId: file.id,
          ...analysis
        });

        // Save to Supabase if available
        if (supabase) {
          try {
            const { error: insertError } = await supabase
              .from('resume_analyses')
              .insert({
                file_name: file.name,
                file_id: file.id,
                candidate_name: analysis.candidateName,
                email: analysis.email,
                skills_match: analysis.skillsMatch,
                experience_relevance: analysis.experienceRelevance,
                education_fit: analysis.educationFit,
                project_impact: analysis.projectImpact,
                total_score: analysis.totalScore,
                key_strengths: analysis.keyStrengths,
                areas_for_improvement: analysis.areasForImprovement,
                analysis: analysis.analysis,
                job_description: jobDescription
              });

            if (insertError) {
              console.error('Error saving to Supabase:', insertError);
            }
          } catch (dbError) {
            console.error('Database error:', dbError);
          }
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errors.push({
          fileName: file.name,
          error: error.message
        });
      }
    }

    // Sort results by total score (highest first)
    results.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      results,
      errors,
      totalProcessed: results.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('Error in /api/analyze-resumes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Resume Rank API is running' });
});

app.get('/api/analyses', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { data, error } = await supabase
      .from('resume_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ analyses: data });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drive-folders', async (req, res) => {
  try {
    if (!drive) {
      return res.status(500).json({ error: 'Google Drive API not available' });
    }

    // Return the hardcoded folders for now
    const folders = [
      { id: "1iDXkG-Ox2VoBToGX1BipoOjcYSMQQpVF", name: "Resume Analysis Folders" },
      { id: "1iDXkG-Ox2VoBToGX1BipoOjcYSMQQpVF", name: "Data Analyst Resumes" },
      { id: "1iDXkG-Ox2VoBToGX1BipoOjcYSMQQpVF", name: "Software Engineer Resumes" }
    ];

    res.json(folders);
  } catch (error) {
    console.error('Error fetching drive folders:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/saved-jobs', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ jobs: data });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/saved-jobs/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    res.json({ job: data });
  } catch (error) {
    console.error('Error fetching saved job:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/save-job', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { job_title, job_description, results } = req.body;
    
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({
        job_title,
        job_description,
        results: JSON.stringify(results)
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ job: data });
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Placeholder endpoints for n8n integration (these would need to be implemented separately)
app.post('/api/n8n/create-calendar-events', async (req, res) => {
  try {
    // This would integrate with n8n workflow for calendar events
    res.json({ success: true, message: 'Calendar events creation endpoint' });
  } catch (error) {
    console.error('Error creating calendar events:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/n8n/send-rejection-emails', async (req, res) => {
  try {
    // This would integrate with n8n workflow for sending rejection emails
    res.json({ success: true, message: 'Rejection emails endpoint' });
  } catch (error) {
    console.error('Error sending rejection emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle all other routes
app.get('*', (req, res) => {
  res.json({ message: 'Resume Rank API - Use /api/analyze-resumes to analyze resumes' });
});

// Export for Vercel
module.exports = app; 