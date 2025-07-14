# Vercel Deployment Guide

This guide will help you deploy your Resume Ranker application to Vercel.

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. Your project code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Environment Variables

Before deploying, you need to set up the following environment variables in your Vercel project:

### Required Environment Variables

1. **SUPABASE_URL**: Your Supabase project URL
2. **SUPABASE_ANON_KEY**: Your Supabase anonymous key
3. **GEMINI_API_KEY**: Your Google Gemini API key
4. **GOOGLE_SERVICE_ACCOUNT**: Your Google Service Account JSON (as a string)

### How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the appropriate value

### Google Service Account Setup

For the `GOOGLE_SERVICE_ACCOUNT` variable, you need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create a Service Account
5. Download the JSON key file
6. Copy the entire JSON content and paste it as the value for `GOOGLE_SERVICE_ACCOUNT`

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   vercel
   ```

4. Follow the prompts to configure your project

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure the project settings:
   - Framework Preset: Other
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add your environment variables
6. Deploy

## Project Structure for Vercel

The project has been configured with the following structure:

```
├── api/
│   └── index.js          # Main API handler
├── src/
│   ├── components/       # React components
│   ├── App.jsx          # Main app component
│   └── index.jsx        # App entry point
├── public/
│   └── index.html       # HTML template
├── package.json         # Dependencies and scripts
├── webpack.config.js    # Build configuration
└── vercel.json          # Vercel configuration
```

## API Endpoints

After deployment, your API will be available at:

- `https://your-domain.vercel.app/api/analyze-resumes` - POST endpoint for resume analysis
- `https://your-domain.vercel.app/api/health` - GET endpoint for health check
- `https://your-domain.vercel.app/api/analyses` - GET endpoint for saved analyses

## Troubleshooting

### Common Issues

1. **Build Failures**: Make sure all dependencies are in `package.json`
2. **API Errors**: Check that all environment variables are set correctly
3. **CORS Issues**: The API is configured to allow requests from Vercel domains

### Environment Variable Format

For the `GOOGLE_SERVICE_ACCOUNT`, make sure to:
- Include the entire JSON object
- Escape quotes properly if needed
- Don't add extra spaces or formatting

Example:
```
{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service@your-project.iam.gserviceaccount.com",...}
```

## Local Development

To test locally before deploying:

1. Install dependencies: `npm install`
2. Set up environment variables in a `.env` file
3. Run development server: `npm run dev`
4. Test the application at `http://localhost:5001`

## Post-Deployment

After successful deployment:

1. Test all functionality on the live site
2. Verify that resume analysis works correctly
3. Check that Supabase integration is working
4. Monitor the Vercel function logs for any errors

## Support

If you encounter issues:

1. Check the Vercel function logs in your dashboard
2. Verify all environment variables are set correctly
3. Test the API endpoints directly using tools like Postman
4. Check the browser console for frontend errors 