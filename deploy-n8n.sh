#!/bin/bash

# n8n Deployment Script for Render
# This script prepares and deploys your n8n automation to Render

echo "🚀 Deploying n8n Automation to Render"
echo "====================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run 'git init' first."
    exit 1
fi

# Add all n8n related files
echo "📦 Adding n8n deployment files..."
git add render.yaml
git add N8N_DEPLOYMENT_GUIDE.md
git add n8n.env.example
git add n8n-workflows/
git add deploy-n8n.sh

# Commit changes
echo "💾 Committing changes..."
git commit -m "Add n8n deployment configuration for Render

- Add render.yaml Blueprint for n8n + Postgres deployment
- Add comprehensive deployment guide
- Add example environment variables
- Add sample automation workflow
- Ready for Render Blueprint deployment"

# Check if remote exists
if ! git remote | grep -q origin; then
    echo "⚠️  No git remote 'origin' found."
    echo "Please add your GitHub repository as origin:"
    echo "git remote add origin https://github.com/yourusername/your-repo.git"
    echo "Then run: git push -u origin main"
    exit 1
fi

# Push to GitHub
echo "🌐 Pushing to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go to https://render.com and sign in"
    echo "2. Click 'New' → 'Blueprint'"
    echo "3. Connect this repository"
    echo "4. Blueprint name: 'n8n-automation'"
    echo "5. Click 'Deploy Blueprint'"
    echo ""
    echo "📖 Full instructions: Read N8N_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "🔗 After deployment, you'll get a URL like:"
    echo "   https://n8n-service-XXXX.onrender.com"
    echo ""
    echo "💡 Don't forget to:"
    echo "   - Update WEBHOOK_URL environment variable"
    echo "   - Import the sample workflow from n8n-workflows/"
    echo "   - Configure your API integrations"
    echo ""
else
    echo "❌ Failed to push to GitHub. Please check your remote configuration."
    echo "Run: git remote -v"
    exit 1
fi 