# n8n Deployment Guide for Render

This guide will help you deploy n8n automation on Render to work alongside your resume-rank application.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com) (free to start)

## Deployment Steps

### 1. Push Your Code to GitHub

Make sure this repository (with the `render.yaml` file) is pushed to GitHub:

```bash
git add .
git commit -m "Add n8n deployment configuration"
git push origin main
```

### 2. Create Render Blueprint

1. **Sign in to Render**: Go to [render.com](https://render.com) and sign in
2. **Connect GitHub**: If not already connected, link your GitHub account
3. **Create Blueprint**:
   - Click **"New"** → **"Blueprint"**
   - Select **"Connect a repository"**
   - Choose this repository
   - Provide a **Blueprint Name**: `n8n-automation`
   - Confirm the **Branch**: `main`
   - Click **"Deploy Blueprint"**

### 3. Wait for Deployment

The Blueprint will create:
- ✅ **n8n Web Service** (free tier)
- ✅ **PostgreSQL Database** (free tier)

**Note**: Free tier limitations:
- Web service spins down after 15 minutes of inactivity
- Free database expires after 30 days
- You can upgrade later for production use

### 4. Configure Webhook URL

After deployment completes:

1. **Get Your Service URL**:
   - Go to your n8n web service in Render Dashboard
   - Copy the `.onrender.com` URL

2. **Update Webhook URL**:
   - Go to **Environment** tab in your web service
   - Find `WEBHOOK_URL` variable
   - Update it with your actual service URL
   - Click **"Save and Deploy"**

### 5. Access Your n8n Instance

1. **Open n8n**: Visit your `.onrender.com` URL
2. **Create Account**: Set up your n8n admin account
3. **Start Automating**: Create workflows for your resume-rank app!

## Automation Ideas for Resume-Rank

Here are some automation workflows you can create:

### 1. **New User Welcome Flow**
- Trigger: New user registration in your app
- Actions: Send welcome email, create Slack notification

### 2. **Resume Processing Pipeline**
- Trigger: New resume uploaded
- Actions: Process with AI, send results, log analytics

### 3. **Job Alert System**
- Trigger: Scheduled (daily/weekly)
- Actions: Fetch new jobs, match with user profiles, send notifications

### 4. **Performance Monitoring**
- Trigger: App errors or performance issues
- Actions: Send alerts to Slack/Discord, create support tickets

## Connecting n8n to Your Resume-Rank App

### Using Webhooks
```javascript
// In your resume-rank app, send data to n8n
const triggerN8N = async (eventType, data) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  
  await fetch(`${webhookUrl}/webhook/${eventType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

// Example usage
await triggerN8N('user-registered', { userId: 123, email: 'user@example.com' });
await triggerN8N('resume-uploaded', { userId: 123, resumeId: 456 });
```

### Using HTTP Requests
Your n8n workflows can make requests to your resume-rank API:
```
GET/POST https://your-resume-rank-app.onrender.com/api/...
```

## Upgrading to Production

When ready for production:

1. **Upgrade Web Service**:
   - Change `plan: free` to `plan: standard` in `render.yaml`
   - Commit and push changes

2. **Upgrade Database**:
   - Change database `plan: free` to `plan: basic-256mb`
   - Commit and push changes

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `N8N_ENCRYPTION_KEY` | Auto-generated encryption key | (generated) |
| `WEBHOOK_URL` | Base URL for webhooks | `https://your-service.onrender.com/` |
| `DB_TYPE` | Database type | `postgresdb` |
| `N8N_PROTOCOL` | Protocol for n8n | `https` |
| `GENERIC_TIMEZONE` | Timezone for workflows | `UTC` |

## Troubleshooting

### Database Creation Failed
- You might already have a free database in your workspace
- Either delete the existing one or upgrade to a paid plan

### Service Won't Start
- Check logs in Render Dashboard
- Verify all environment variables are set correctly

### Webhooks Not Working
- Ensure `WEBHOOK_URL` is set to your actual service URL
- Check that your service is not sleeping (free tier limitation)

## Security Notes

1. **Access Control**: Set up proper authentication in n8n
2. **API Keys**: Store sensitive credentials as Render environment variables
3. **Network Security**: Use private networking if on paid plans

## Next Steps

1. ✅ Deploy n8n on Render
2. ✅ Create your first automation workflow
3. ✅ Connect it to your resume-rank application
4. ✅ Monitor and optimize your automations

Happy automating! 🚀 