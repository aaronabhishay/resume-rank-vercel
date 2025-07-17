# Quick Start: Connect Vercel to n8n on Railway

## 🚀 What's Been Done

Your Vercel app has been updated with:
- ✅ Real n8n webhook integration endpoints
- ✅ Enhanced error handling and logging
- ✅ Setup and test scripts
- ✅ Comprehensive documentation

## 📋 Next Steps (5 minutes)

### 1. Get Your n8n Webhook URLs
From your Railway n8n instance, copy the webhook URLs for:
- Calendar events creation
- Email sending

### 2. Add Environment Variables to Vercel
In your Vercel dashboard → Settings → Environment Variables, add:
```
N8N_CALENDAR_WEBHOOK_URL=https://your-n8n-instance.railway.app/webhook/calendar-events
N8N_EMAIL_WEBHOOK_URL=https://your-n8n-instance.railway.app/webhook/send-emails
```

### 3. Deploy Your Updated App
```bash
git add .
git commit -m "Add n8n integration endpoints"
git push origin main
```

### 4. Test the Integration
```bash
npm run test-n8n
```

## 🔧 Available Scripts

- `npm run setup-n8n` - Interactive setup for environment variables
- `npm run test-n8n` - Test the n8n integration endpoints

## 📖 Full Documentation

See `N8N_INTEGRATION_GUIDE.md` for complete setup instructions, troubleshooting, and advanced configuration.

## 🎯 What This Enables

Your Resume Rank app can now:
- Automatically create calendar events for interviews via n8n
- Send automated rejection emails via n8n
- Integrate with any other n8n workflows you create

The integration is production-ready with proper error handling and logging! 