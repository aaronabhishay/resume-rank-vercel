# Deploying Resume Rank on Vercel

This guide will help you deploy your Resume Rank application on Vercel while ensuring all functionality works correctly.

## Prerequisites

1. [Vercel account](https://vercel.com/signup)
2. [GitHub account](https://github.com/signup) (optional, for easier deployment)
3. Google Gemini API key
4. Google Service Account credentials for Drive API access

## Environment Variables

You need to set up the following environment variables in your Vercel project:

1. `GEMINI_API_KEY` - Your Google Gemini API key
2. `GOOGLE_SERVICE_ACCOUNT` - Your Google service account JSON stringified

## Deployment Steps

### 1. Push your code to GitHub (recommended)

- Create a new GitHub repository
- Push your code to the repository
- Connect Vercel to your GitHub account

### 2. Import your project on Vercel

- From your Vercel dashboard, click "Add New" > "Project"
- Import your GitHub repository or upload your files directly
- Configure the project with the following settings:

**Build Settings:**
- Framework Preset: Other
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3. Configure Environment Variables

In your Vercel project settings, add these environment variables:

1. `GEMINI_API_KEY`: Your Google Gemini API key
2. `GOOGLE_SERVICE_ACCOUNT`: Your Google Service Account JSON stringified

For the Google Service Account, you need to:
1. Create a service account in Google Cloud Console
2. Enable the Google Drive API
3. Create a key for the service account (JSON format)
4. Stringify the JSON and add it as an environment variable

Example of stringified service account JSON:
```
{"type":"service_account","project_id":"your-project-id","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYour private key content\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"}
```

### 4. Deploy

- Click "Deploy" to start the deployment process
- Vercel will build and deploy your application
- Once deployed, you can access your application at the provided URL

## Troubleshooting

If your deployment fails or doesn't work as expected:

1. Check the deployment logs in Vercel for any errors
2. Verify that all environment variables are set correctly
3. Make sure your Google API credentials have the necessary permissions
4. Test the API endpoints with Postman or a similar tool to isolate issues

## Local Development

For local development, create a `.env` file in your project root with the same environment variables:

```
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
```

Then run:
```
npm run dev
```

This will start the development server with hot reloading enabled. 