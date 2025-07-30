const express = require('express');
const path = require('path');

// Test the server configuration
const app = express();

// Test basic middleware
app.use(express.json());

// Test static file serving
app.use(express.static(path.join(__dirname, 'dist')));

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test environment variables
app.get('/api/env-test', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
    GOOGLE_SERVICE_ACCOUNT: process.env.GOOGLE_SERVICE_ACCOUNT ? 'Set' : 'Not set'
  };
  
  res.json({ 
    environment: envVars,
    timestamp: new Date().toISOString()
  });
});

// Test SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test endpoints:`);
  console.log(`  - http://localhost:${PORT}/api/test`);
  console.log(`  - http://localhost:${PORT}/api/health`);
  console.log(`  - http://localhost:${PORT}/api/env-test`);
});

module.exports = app; 