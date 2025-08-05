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
} 