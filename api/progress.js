const express = require('express');
const router = express.Router();

// Store active progress streams
const activeStreams = new Map();

// SSE endpoint for progress updates
router.get('/stream/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Store the response stream
  activeStreams.set(sessionId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    activeStreams.delete(sessionId);
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    if (activeStreams.has(sessionId)) {
      res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
    } else {
      clearInterval(keepAlive);
    }
  }, 30000);
});

// Function to send progress update
function sendProgressUpdate(sessionId, data) {
  const stream = activeStreams.get(sessionId);
  if (stream) {
    stream.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

// Function to close progress stream
function closeProgressStream(sessionId) {
  const stream = activeStreams.get(sessionId);
  if (stream) {
    stream.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    stream.end();
    activeStreams.delete(sessionId);
  }
}

module.exports = { router, sendProgressUpdate, closeProgressStream };
