# Google OAuth 2.0 Setup Guide

This guide will help you set up Google OAuth 2.0 authentication so users can automatically access their Google Drive folders without manual sharing.

## Prerequisites

- A Google Cloud Platform account
- A Google Cloud Project
- Basic understanding of OAuth 2.0

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Resume Ranker")
5. Click "Create"

## Step 2: Enable Google Drive API

1. In your Google Cloud Project, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:

   - Choose "External" user type
   - Fill in the required information:
     - App name: "Resume Ranker"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `https://www.googleapis.com/auth/drive.readonly`
   - Add test users (your email for testing)
   - Save and continue

4. Create OAuth 2.0 Client ID:

   - Application type: "Web application"
   - Name: "Resume Ranker Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5001` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5000/auth/google/callback` (for development)
     - `https://your-production-domain.com/auth/google/callback` (for production)
   - Click "Create"

5. Copy the Client ID and Client Secret (you'll need these for environment variables)

## Step 4: Set Up Environment Variables

Create or update your `.env` file with the following variables:

```env
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Existing variables (keep these)
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_SERVICE_ACCOUNT=your_service_account_json
```

## Step 5: Update Your Application

The application has been updated with:

1. **Backend OAuth Routes** (`server.js`):

   - `/auth/google` - Initiates OAuth flow
   - `/auth/google/callback` - Handles OAuth callback
   - Updated Drive API functions to use OAuth tokens

2. **Frontend Component** (`src/components/GoogleAuth.jsx`):

   - GoogleAuth component for user authentication
   - Automatic token storage and management
   - Integration with AnalysisPage

3. **Updated Analysis Flow**:
   - Users can now connect their Google Drive
   - Access tokens are automatically included in analysis requests
   - No manual folder sharing required

## Step 6: Testing the Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to the analysis page
3. Click "Connect Google Drive"
4. Complete the OAuth flow
5. Try analyzing a folder from your Drive

## How It Works

### Before (Manual Sharing):

1. User creates a folder in Google Drive
2. User manually shares the folder with service account email
3. Application accesses the folder using service account

### After (OAuth Authentication):

1. User clicks "Connect Google Drive"
2. User authorizes the application via Google OAuth
3. Application gets access token for user's Drive
4. Application can access any folder the user has access to
5. No manual sharing required

## Security Considerations

1. **Token Storage**: Access tokens are stored in localStorage for simplicity. In production, consider:

   - Server-side token storage
   - Token encryption
   - Token refresh handling

2. **Scopes**: The application requests minimal scopes:

   - `https://www.googleapis.com/auth/drive.readonly` - Read-only access to Drive
   - `https://www.googleapis.com/auth/userinfo.email` - User's email address

3. **Token Expiration**: Access tokens expire after 1 hour. Consider implementing:
   - Automatic token refresh
   - User re-authentication prompts

## Production Deployment

For production deployment:

1. Update the OAuth consent screen with your production domain
2. Add production redirect URIs to your OAuth credentials
3. Update environment variables with production URLs
4. Consider implementing secure token storage
5. Set up proper error handling and logging

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**:

   - Check that your redirect URI matches exactly in Google Cloud Console
   - Ensure the URI is added to authorized redirect URIs

2. **"Access denied" error**:

   - Check that the Google Drive API is enabled
   - Verify OAuth consent screen is configured
   - Ensure test users are added (for external apps)

3. **"Invalid client" error**:

   - Verify your Client ID and Client Secret are correct
   - Check that the credentials are for a web application

4. **CORS errors**:
   - Ensure your domain is added to authorized JavaScript origins
   - Check that your backend CORS configuration includes your frontend domain

### Debug Steps:

1. Check browser console for JavaScript errors
2. Check server logs for backend errors
3. Verify environment variables are loaded correctly
4. Test OAuth flow in incognito mode
5. Check Google Cloud Console for API usage and errors

## Migration from Service Account

If you're currently using a service account:

1. Keep the service account as a fallback
2. The application will use OAuth tokens when available
3. Falls back to service account for users who haven't connected their Drive
4. Gradually migrate users to OAuth authentication

## Benefits

- **No Manual Sharing**: Users don't need to manually share folders
- **Better UX**: Seamless authentication flow
- **Security**: Users control their own access
- **Scalability**: Works with any user's Drive folders
- **Compliance**: Users explicitly authorize access
