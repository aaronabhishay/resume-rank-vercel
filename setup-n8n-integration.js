#!/usr/bin/env node

/**
 * Setup script for n8n integration with Vercel
 * This script helps you configure the necessary environment variables
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupN8nIntegration() {
  console.log('🚀 Setting up n8n Integration with Vercel\n');
  
  console.log('This script will help you configure the environment variables needed to connect your Vercel app to n8n workflows on Railway.\n');
  
  // Get n8n webhook URLs
  const calendarWebhookUrl = await question('Enter your n8n calendar events webhook URL (e.g., https://your-n8n-instance.railway.app/webhook/calendar-events): ');
  const emailWebhookUrl = await question('Enter your n8n email webhook URL (e.g., https://your-n8n-instance.railway.app/webhook/send-emails): ');
  
  console.log('\n📋 Environment Variables to Add to Vercel:\n');
  console.log('N8N_CALENDAR_WEBHOOK_URL=' + calendarWebhookUrl);
  console.log('N8N_EMAIL_WEBHOOK_URL=' + emailWebhookUrl);
  
  console.log('\n📝 Instructions:');
  console.log('1. Go to your Vercel project dashboard');
  console.log('2. Navigate to Settings → Environment Variables');
  console.log('3. Add the two environment variables above');
  console.log('4. Redeploy your application');
  
  console.log('\n🔧 Alternative: Use Vercel CLI');
  console.log('vercel env add N8N_CALENDAR_WEBHOOK_URL');
  console.log('vercel env add N8N_EMAIL_WEBHOOK_URL');
  
  console.log('\n✅ Setup complete! Your Vercel app is now ready to connect to n8n workflows.');
  console.log('\n📖 For detailed instructions, see: N8N_INTEGRATION_GUIDE.md');
  
  rl.close();
}

setupN8nIntegration().catch(console.error); 