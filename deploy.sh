#!/bin/bash

# Resume Ranker Vercel Deployment Script

echo "🚀 Starting Resume Ranker deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Build the project
echo "📦 Building the project..."
npm run vercel-build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in your Vercel dashboard:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - GEMINI_API_KEY"
echo "   - GOOGLE_SERVICE_ACCOUNT"
echo ""
echo "2. Test your application at the provided URL"
echo ""
echo "3. Check the VERCEL_DEPLOYMENT.md file for detailed instructions" 