#!/usr/bin/env node

/**
 * Test script for n8n integration
 * This script tests the webhook endpoints to ensure they're working correctly
 */

const fetch = require('node-fetch');

// Configuration
const VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const TEST_EVENTS = [
  {
    title: 'Test Interview - John Doe',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
    description: 'Technical interview for Software Engineer position',
    attendees: ['john.doe@example.com'],
    candidateName: 'John Doe'
  }
];

const TEST_EMAIL = {
  recipients: ['test@example.com'],
  subject: 'Test Email from Resume Rank',
  body: 'This is a test email to verify n8n integration is working correctly.'
};

async function testCalendarWebhook() {
  console.log('🧪 Testing Calendar Events Webhook...');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/n8n/create-calendar-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: TEST_EVENTS }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Calendar webhook test successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Calendar webhook test failed!');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Calendar webhook test failed with error:', error.message);
  }
}

async function testEmailWebhook() {
  console.log('\n🧪 Testing Email Webhook...');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/n8n/send-rejection-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_EMAIL),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Email webhook test successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Email webhook test failed!');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Email webhook test failed with error:', error.message);
  }
}

async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/health`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Health endpoint working!');
      console.log('Response:', result);
    } else {
      console.log('❌ Health endpoint failed!');
      console.log('Status:', response.status);
    }
  } catch (error) {
    console.log('❌ Health endpoint failed with error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting n8n Integration Tests\n');
  console.log('Vercel URL:', VERCEL_URL);
  console.log('Make sure your Vercel app is deployed and environment variables are set!\n');
  
  await testHealthEndpoint();
  await testCalendarWebhook();
  await testEmailWebhook();
  
  console.log('\n📋 Test Summary:');
  console.log('- If all tests pass: Your n8n integration is working correctly!');
  console.log('- If webhook tests fail: Check your environment variables and n8n webhook URLs');
  console.log('- If health test fails: Your Vercel app might not be deployed or accessible');
  
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Verify N8N_CALENDAR_WEBHOOK_URL and N8N_EMAIL_WEBHOOK_URL are set in Vercel');
  console.log('2. Check that your n8n workflows are active and webhook nodes are configured');
  console.log('3. Ensure your n8n instance is accessible from the internet');
  console.log('4. Check Vercel function logs for detailed error messages');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testCalendarWebhook, testEmailWebhook, testHealthEndpoint }; 