# Deploying Resume Ranker to Vercel

This guide explains how to deploy the Resume Ranker application to Vercel.

## Prerequisites

1. [Vercel account](https://vercel.com/signup)
2. [GitHub account](https://github.com/join) (recommended for easier deployment)
3. [Git](https://git-scm.com/downloads) installed on your computer

## Step 1: Prepare your project for Vercel

The project structure has been updated to support Vercel deployment with:
- Serverless API functions in the `/api` directory
- Configured `vercel.json` for routing

## Step 2: Set up a GitHub repository (recommended)

1. Create a new GitHub repository:
   - Go to [GitHub](https://github.com) and click "New repository"
   - Name it "resume-rank" or your preferred name
   - Make it public or private
   - Click "Create repository"

2. Push your code to GitHub:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/resume-rank.git
   git push -u origin main
   ```

## Step 3: Deploy to Vercel

### Option 1: Deploy via the Vercel Dashboard (with GitHub)

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Configure settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Gemini API key
6. Click "Deploy"

### Option 2: Deploy using the Vercel CLI

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the project:
   ```
   vercel
   ```

4. Follow the prompts and add your environment variables when asked.

## Step 4: Configure Domain (Optional)

1. In your Vercel project settings, go to "Domains"
2. Add your custom domain and follow the instructions to set up DNS records

## Environment Variables

Make sure to set these environment variables in the Vercel project settings:

- `GEMINI_API_KEY`: Your Google Gemini API key

## Troubleshooting

- If API calls fail, check that:
  - Your environment variables are correctly set in Vercel
  - The API endpoints are correctly formatted in your frontend code
  - CORS settings are properly configured

## Updating Your Deployment

When you make changes to your code:

1. Commit changes to GitHub:
   ```
   git add .
   git commit -m "Your update message"
   git push
   ```

2. Vercel will automatically deploy the updates if you've connected your GitHub repository.

3. For manual deployments, run:
   ```
   vercel
   ```

## Local Development

To run the project locally:

```
npm run dev
```

This will start both the frontend and backend servers. 