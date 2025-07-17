# Connecting Vercel to n8n on Railway

This guide will help you connect your Vercel-deployed Resume Rank application to your n8n workflows deployed on Railway.

## Prerequisites

- ✅ Vercel app deployed (resume-rank)
- ✅ n8n workflows deployed on Railway
- ✅ n8n webhook nodes configured in your workflows

## Step 1: Get n8n Webhook URLs

### From Your n8n Railway Instance:

1. **Access your n8n instance** on Railway
2. **Navigate to your workflow** that handles calendar events and emails
3. **Find the webhook nodes** in your workflow
4. **Copy the webhook URLs** for:
   - Calendar events creation
   - Email sending

### Example webhook URLs:
```
https://your-n8n-instance.railway.app/webhook/calendar-events
https://your-n8n-instance.railway.app/webhook/send-emails
```

## Step 2: Update Vercel Environment Variables

### In Vercel Dashboard:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these new environment variables:

```
N8N_CALENDAR_WEBHOOK_URL=https://your-n8n-instance.railway.app/webhook/calendar-events
N8N_EMAIL_WEBHOOK_URL=https://your-n8n-instance.railway.app/webhook/send-emails
```

### Or via Vercel CLI:

```bash
vercel env add N8N_CALENDAR_WEBHOOK_URL
vercel env add N8N_EMAIL_WEBHOOK_URL
```

## Step 3: Update API Endpoints

The API endpoints in your Vercel app need to be updated to actually call your n8n webhooks instead of being placeholders.

### Update `/api/index.js`:

```javascript
// Replace the placeholder n8n endpoints with actual webhook calls
app.post('/api/n8n/create-calendar-events', async (req, res) => {
  try {
    const { events } = req.body;
    console.log('Events being sent to n8n:', JSON.stringify(events, null, 2));
    
    // Call n8n webhook for calendar events
    const response = await fetch(process.env.N8N_CALENDAR_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar events');
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error creating calendar events:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/n8n/send-rejection-emails', async (req, res) => {
  try {
    const { recipients, subject, body } = req.body;
    
    // Call n8n webhook for sending emails
    const response = await fetch(process.env.N8N_EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipients, subject, body }),
    });

    if (!response.ok) {
      throw new Error('Failed to send rejection emails');
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error sending rejection emails:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## Step 4: Configure n8n Workflow Webhook Nodes

### In Your n8n Workflow:

1. **Add Webhook nodes** to receive data from Vercel
2. **Configure the webhook URLs** to match your environment variables
3. **Set up the workflow logic** to:
   - Create calendar events (using Google Calendar node)
   - Send emails (using Email node)

### Example n8n Workflow Structure:

```
Webhook (Calendar Events) → Google Calendar → Email Notification
Webhook (Send Emails) → Email Service → Success Response
```

## Step 5: Test the Integration

### Test Calendar Events:

1. **Deploy your updated Vercel app**
2. **Run a resume analysis** in your app
3. **Click "Add All Events"** in the results
4. **Check n8n logs** to see if the webhook was received
5. **Verify calendar events** were created

### Test Email Sending:

1. **Use the email functionality** in your app
2. **Check n8n logs** for webhook reception
3. **Verify emails** were sent successfully

## Step 6: Error Handling and Monitoring

### Add Error Handling:

```javascript
// Enhanced error handling for n8n webhooks
app.post('/api/n8n/create-calendar-events', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!process.env.N8N_CALENDAR_WEBHOOK_URL) {
      throw new Error('N8N_CALENDAR_WEBHOOK_URL not configured');
    }
    
    const response = await fetch(process.env.N8N_CALENDAR_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error creating calendar events:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to communicate with n8n workflow'
    });
  }
});
```

### Monitoring:

- **Vercel Function Logs**: Check Vercel dashboard for API function logs
- **n8n Execution Logs**: Monitor your Railway n8n instance logs
- **Webhook Testing**: Use tools like webhook.site to test webhook URLs

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure n8n allows requests from Vercel domains
2. **Webhook Timeout**: n8n webhooks might timeout for long-running operations
3. **Authentication**: If your n8n instance requires authentication, add headers
4. **Environment Variables**: Double-check that environment variables are set correctly

### Debug Steps:

1. **Test webhook URLs directly** using curl or Postman
2. **Check n8n workflow execution** in the Railway dashboard
3. **Verify environment variables** are loaded correctly
4. **Monitor network requests** in browser developer tools

## Security Considerations

1. **Webhook Authentication**: Consider adding authentication to your n8n webhooks
2. **Input Validation**: Validate all data before sending to n8n
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **HTTPS Only**: Ensure all webhook URLs use HTTPS

## Example n8n Webhook Configuration

### Calendar Events Webhook:
```json
{
  "name": "Calendar Events Webhook",
  "type": "n8n-nodes-base.webhook",
  "position": [0, 0],
  "parameters": {
    "httpMethod": "POST",
    "path": "calendar-events",
    "responseMode": "responseNode",
    "options": {}
  }
}
```

### Email Webhook:
```json
{
  "name": "Email Webhook",
  "type": "n8n-nodes-base.webhook",
  "position": [0, 0],
  "parameters": {
    "httpMethod": "POST",
    "path": "send-emails",
    "responseMode": "responseNode",
    "options": {}
  }
}
```

## Next Steps

After successful integration:

1. **Monitor performance** and optimize if needed
2. **Add more automation workflows** as needed
3. **Implement error recovery** mechanisms
4. **Set up alerts** for failed webhook calls
5. **Document the integration** for team members

This integration will allow your Vercel app to trigger n8n workflows for automated calendar event creation and email sending, creating a seamless automation pipeline for your resume ranking application. 