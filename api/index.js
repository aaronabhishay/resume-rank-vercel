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

// Export for Vercel
module.exports = app; 