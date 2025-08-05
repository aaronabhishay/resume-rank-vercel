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

// Drive folders endpoint
app.get('/api/drive-folders', async (req, res) => {
  try {
    if (!drive) {
      throw new Error('Google Drive API not initialized');
    }

    const PARENT_FOLDER_ID = "1iDXkG-Ox2VoBToGX1BipoOjcYSMQQpVF";
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

// Export for Vercel
module.exports = app; 