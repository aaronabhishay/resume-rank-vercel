# Vercel Deployment Guide

This guide will help you deploy the Resume Rank application to Vercel.

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. A Supabase project with the required tables
3. Google Cloud Platform project with necessary APIs enabled
4. GitHub repository with your code

## Step 1: Prepare Your Repository

Make sure your repository contains all the necessary files:

- `package.json` with build scripts
- `vercel.json` configuration
- `webpack.config.js` for building the frontend
- `server.js` for the backend API

## Step 2: Set Up Environment Variables

In your Vercel dashboard, go to your project settings and add the following environment variables:

### Required Variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `GEMINI_API_KEY`: Your Google Gemini API key

### Optional Variables:

- `GOOGLE_SERVICE_ACCOUNT`: JSON string of your Google service account credentials
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: Your Vercel domain + `/auth/google/callback`
- `N8N_CALENDAR_WEBHOOK_URL`: n8n webhook URL for calendar events
- `N8N_EMAIL_WEBHOOK_URL`: n8n webhook URL for email sending

## Step 3: Deploy to Vercel

1. **Connect Repository**: In Vercel dashboard, click "New Project" and import your GitHub repository

2. **Configure Build Settings**:

   - Framework Preset: `Other`
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Deploy**: Click "Deploy" and wait for the build to complete

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update your environment variables with the new domain

## Step 5: Update Google OAuth Settings

If using Google OAuth:

1. Go to Google Cloud Console
2. Update your OAuth 2.0 client settings
3. Add your Vercel domain to authorized redirect URIs:
   - `https://your-domain.vercel.app/auth/google/callback`
   - `https://your-project.vercel.app/auth/google/callback`

## Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Test the main functionality:
   - Resume analysis
   - Google Drive integration
   - Dashboard features
   - Saved jobs functionality

## Troubleshooting

### Common Issues:

1. **Build Failures**:

   - Check that all dependencies are in `package.json`
   - Ensure webpack configuration is correct
   - Verify environment variables are set

2. **API Errors**:

   - Check CORS settings in `server.js`
   - Verify environment variables are correctly set
   - Check Supabase connection

3. **Google Drive Issues**:
   - Verify service account credentials
   - Check Google Drive API is enabled
   - Ensure proper folder permissions

### Environment Variable Format:

For `GOOGLE_SERVICE_ACCOUNT`, use the entire JSON as a single line:

```json
{
  "type": "service_account",
  "project_id": "your_project",
  "private_key_id": "key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service@project.iam.gserviceaccount.com",
  "client_id": "client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service%40project.iam.gserviceaccount.com"
}
```

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test locally first with the same environment variables
4. Check the browser console for frontend errors
