const express = require('express');
const { google } = require('googleapis');

// Initialize OAuth 2.0 client
let oauth2Client;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'https://resume-rank-vercel.vercel.app/auth/google/callback'
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!oauth2Client) {
    return res.status(500).json({ error: 'Google OAuth is not configured' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    console.log('Processing OAuth callback with code...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Redirect back to frontend with tokens in URL
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
} 