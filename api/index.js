const express = require('express');
const cors = require('cors');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('=== VERCEL SERVERLESS FUNCTION STARTING ===');

const app = express();

// CORS configuration
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

// Initialize services
let supabase, oauth2Client, genAI, drive;

try {
  // Initialize Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('Supabase initialized');
  }

  // Initialize Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const { google } = require('googleapis');
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://resume-rank-vercel.vercel.app/auth/google/callback'
    );
    console.log('Google OAuth initialized');
  }

  // Initialize Gemini API
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini API initialized');
  }

  // Initialize Google Drive
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    const { google } = require('googleapis');
    drive = google.drive({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      }),
    });
    console.log('Google Drive initialized');
  }
} catch (error) {
  console.error('Error initializing services:', error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    oauth2Client: oauth2Client ? 'Initialized' : 'Not initialized'
  });
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
    
    const baseUrl = 'https://resume-rank-vercel.vercel.app';
    const redirectUrl = `${baseUrl}/analysis?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token || ''}&oauth_success=true`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error getting tokens:', error);
    const baseUrl = 'https://resume-rank-vercel.vercel.app';
    const errorRedirectUrl = `${baseUrl}/analysis?error=${encodeURIComponent('Failed to authorize Google Drive access')}`;
    res.redirect(errorRedirectUrl);
  }
});

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('Fetching dashboard stats...');
    
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
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

// Recent analyses endpoint
app.get('/api/dashboard/recent', async (req, res) => {
  try {
    console.log('Fetching recent analyses...');
    
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    // Get recent analyses from resume_analyses table
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('job_description, resume_name, total_score, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

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

    // Convert to array and calculate averages
    const recentAnalyses = Object.values(jobGroups).map(group => ({
      id: group.job_description.substring(0, 20) + '...',
      title: group.job_description.substring(0, 50) + (group.job_description.length > 50 ? '...' : ''),
      candidates: group.count,
      avgScore: Math.round((group.total_score / group.count) * 10) / 10,
      status: 'completed',
      date: formatTimeAgo(group.latest_date),
      rawDate: group.latest_date
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

// Drive folders endpoint - get all folders from connected Google account
app.get('/api/drive-folders', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.query.access_token;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required. Please connect your Google Drive first.' });
    }

    let driveClient;
    try {
      driveClient = getDriveClient(accessToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid access token. Please reconnect your Google Drive.' });
    }

    console.log('Fetching all folders from user\'s Google Drive...');
    
    // Fetch all folders accessible to the user, ordered by name
    const response = await driveClient.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name, parents, modifiedTime, webViewLink)',
      orderBy: 'name',
      pageSize: 100 // Get up to 100 folders
    });

    if (!response.data.files || response.data.files.length === 0) {
      return res.json([]);
    }

    // Organize folders and add some useful metadata
    const folders = response.data.files.map(folder => ({
      id: folder.id,
      name: folder.name,
      webViewLink: folder.webViewLink,
      modifiedTime: folder.modifiedTime,
      isRoot: !folder.parents || folder.parents.length === 0,
      // Create a shareable link format
      shareLink: `https://drive.google.com/drive/folders/${folder.id}`
    }));

    console.log(`Found ${folders.length} folders in user's Google Drive`);
    res.json(folders);
  } catch (error) {
    console.error('Error fetching user folders:', error);
    
    // Handle specific Google API errors
    if (error.code === 401) {
      res.status(401).json({ error: 'Authentication failed. Please reconnect your Google Drive.' });
    } else if (error.code === 403) {
      res.status(403).json({ error: 'Access denied. Please check your Google Drive permissions.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch folders from Google Drive' });
    }
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

// Helper functions for drive and resume analysis
async function extractFolderId(url) {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function getResumesFromDrive(folderId, accessToken = null) {
  const driveClient = getDriveClient(accessToken);
  const response = await driveClient.files.list({
    q: `'${folderId}' in parents and mimeType='application/pdf'`,
    fields: 'files(id, name)',
  });
  return response.data.files;
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

// Analyze endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { jobDescription, driveFolderLink, experienceLevel, scoringLogic, weights, accessToken } = req.body;
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
    
    console.log(`Analyzing ${resumes.length} resumes...`);
    
    const analysisPromises = resumes.map(async (file) => {
      try {
        console.log(`Processing resume: ${file.name}`);
        const resumeText = await downloadAndParseResume(file.id, accessToken);
        
        // Analyze the resume against the job description
        console.log(`Analyzing resume: ${file.name}`);
        const analysis = await analyzeResume(resumeText, jobDescription, weights);
        
        // Store the analysis result in Supabase
        if (supabase) {
          try {
            const timestamp = new Date().toISOString();
            
            // Prepare the record data
            const recordData = {
              job_description: jobDescription,
              resume_name: file.name,
              resume_id: file.id,
              skills_match: analysis.skillsMatch,
              experience_relevance: analysis.experienceRelevance,
              education_fit: analysis.educationFit,
              project_impact: analysis.projectImpact,
              key_strengths: analysis.keyStrengths,
              areas_for_improvement: analysis.areasForImprovement,
              total_score: analysis.totalScore,
              analysis_text: analysis.analysis,
              email: analysis.email,
              created_at: timestamp
            };
            
            console.log('Attempting to store record in Supabase...');
            
            // Try to insert the record with clear error logging
            const { data, error } = await supabase
              .from('resume_analyses')
              .insert([recordData]);
            
            if (error) {
              console.error('Supabase insertion error code:', error.code);
              console.error('Supabase insertion error message:', error.message);
              
              if (error.code === '42501') {
                console.error('RLS Policy Error: You need to update the Row Level Security policy in Supabase');
                console.error('Go to Supabase dashboard > Authentication > Policies and either:');
                console.error('1. Disable RLS for the resume_analyses table (for development) OR');
                console.error('2. Create a policy that allows inserts without authentication');
              }
              
              analysis.stored = false;
              analysis.storeError = error.message;
            } else {
              console.log('Analysis stored in Supabase successfully');
              analysis.stored = true;
            }
          } catch (dbError) {
            console.error('Error with Supabase operation:', dbError);
            analysis.stored = false;
            analysis.storeError = dbError.message;
          }
        }
        
        return {
          fileName: file.name,
          fileId: file.id,
          analysis
        };
      } catch (error) {
        console.error(`Error processing resume ${file.name}:`, error);
        return {
          fileName: file.name,
          fileId: file.id,
          error: error.message
        };
      }
    });
    
    // Wait for all analyses to complete
    const results = await Promise.all(analysisPromises);
    
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
    res.json({ results });
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export for Vercel
module.exports = app; 