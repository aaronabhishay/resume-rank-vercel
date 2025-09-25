const express = require('express');
const { initialize, getInstance } = require('../src/services/resumeProcessingSystem');

/**
 * Enhanced Processing API Endpoints
 * Integrates the new resume processing system with existing infrastructure
 */

const router = express.Router();

// Global processing system instance
let processingSystem = null;

/**
 * Initialize the enhanced processing system
 */
async function initializeSystem() {
  if (!processingSystem && process.env.GEMINI_API_KEY) {
    try {
      processingSystem = await initialize(process.env.GEMINI_API_KEY, {
        autoStart: true,
        enableMonitoring: true,
        enableScheduling: true
      });
      console.log('Enhanced processing system initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced processing system:', error);
    }
  }
}

// Initialize on startup
initializeSystem();

/**
 * Enhanced batch processing endpoint
 * POST /api/enhanced/process-batch
 */
router.post('/process-batch', async (req, res) => {
  try {
    const { resumes, jobDescription, weights, priority = 'normal' } = req.body;

    if (!processingSystem) {
      return res.status(503).json({ 
        error: 'Enhanced processing system not available. Using fallback mode.',
        fallback: true 
      });
    }

    if (!resumes || !Array.isArray(resumes)) {
      return res.status(400).json({ error: 'Resumes array is required' });
    }

    console.log(`Enhanced batch processing: ${resumes.length} resumes`);

    // Queue resumes for processing
    const result = await processingSystem.processResumeFiles(resumes, jobDescription, {
      priority,
      weights
    });

    res.json({
      success: true,
      message: `Queued ${resumes.length} resumes for enhanced processing`,
      queueIds: result.queueIds,
      estimatedCompletionTime: result.estimatedCompletionTime,
      trackingUrl: result.trackingUrl,
      enhanced: true
    });

  } catch (error) {
    console.error('Enhanced batch processing error:', error);
    res.status(500).json({ 
      error: error.message,
      enhanced: true 
    });
  }
});

/**
 * Google Drive folder processing with queue
 * POST /api/enhanced/process-drive-folder
 */
router.post('/process-drive-folder', async (req, res) => {
  try {
    const { folderId, jobDescription, weights, accessToken, priority = 'normal' } = req.body;

    if (!processingSystem) {
      return res.status(503).json({ 
        error: 'Enhanced processing system not available. Using fallback mode.',
        fallback: true 
      });
    }

    if (!folderId) {
      return res.status(400).json({ error: 'Folder ID is required' });
    }

    console.log(`Enhanced Google Drive processing: ${folderId}`);

    // For now, integrate with existing Google Drive code
    // This is where you'd connect to your existing getResumesFromDrive function
    
    // Placeholder response showing the integration point
    const result = await processingSystem.processGoogleDriveFolder(folderId, jobDescription, {
      priority,
      weights,
      accessToken
    });

    res.json({
      success: true,
      message: 'Google Drive folder queued for enhanced processing',
      ...result,
      enhanced: true
    });

  } catch (error) {
    console.error('Enhanced Drive processing error:', error);
    res.status(500).json({ 
      error: error.message,
      enhanced: true 
    });
  }
});

/**
 * Get processing status
 * GET /api/enhanced/status
 */
router.get('/status', async (req, res) => {
  try {
    if (!processingSystem) {
      return res.json({ 
        status: 'unavailable',
        message: 'Enhanced processing system not initialized' 
      });
    }

    const status = processingSystem.getStatus();
    
    res.json({
      success: true,
      status,
      enhanced: true
    });

  } catch (error) {
    console.error('Status retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get queue details
 * GET /api/enhanced/queue
 */
router.get('/queue', async (req, res) => {
  try {
    if (!processingSystem) {
      return res.json({ 
        status: 'unavailable',
        message: 'Enhanced processing system not initialized' 
      });
    }

    const { status, priority } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const queueDetails = processingSystem.getQueueDetails(filters);
    
    res.json({
      success: true,
      queue: queueDetails,
      enhanced: true
    });

  } catch (error) {
    console.error('Queue retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Control processing (pause/resume)
 * POST /api/enhanced/control
 */
router.post('/control', async (req, res) => {
  try {
    const { action } = req.body;

    if (!processingSystem) {
      return res.status(503).json({ 
        error: 'Enhanced processing system not available' 
      });
    }

    switch (action) {
      case 'pause':
        processingSystem.pause();
        res.json({ success: true, message: 'Processing paused' });
        break;
        
      case 'resume':
        processingSystem.resume();
        res.json({ success: true, message: 'Processing resumed' });
        break;
        
      case 'stop':
        await processingSystem.stop();
        res.json({ success: true, message: 'Processing stopped' });
        break;
        
      default:
        res.status(400).json({ error: 'Invalid action. Use: pause, resume, stop' });
    }

  } catch (error) {
    console.error('Control action error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export statistics
 * GET /api/enhanced/export-stats
 */
router.get('/export-stats', async (req, res) => {
  try {
    if (!processingSystem) {
      return res.status(503).json({ 
        error: 'Enhanced processing system not available' 
      });
    }

    const stats = processingSystem.exportStatistics();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="processing-stats-${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json(stats);

  } catch (error) {
    console.error('Export statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check endpoint
 * GET /api/enhanced/health
 */
router.get('/health', async (req, res) => {
  try {
    if (!processingSystem) {
      return res.json({ 
        status: 'unhealthy',
        reason: 'Enhanced processing system not initialized',
        enhanced: false
      });
    }

    const health = processingSystem.healthCheck();
    
    res.json({
      ...health,
      enhanced: true
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      reason: error.message,
      enhanced: true
    });
  }
});

/**
 * Get processing capacity information
 * GET /api/enhanced/capacity
 */
router.get('/capacity', async (req, res) => {
  try {
    if (!processingSystem) {
      return res.json({ 
        available: false,
        message: 'Enhanced processing system not available' 
      });
    }

    const status = processingSystem.getStatus();
    
    // Calculate capacity metrics
    const dailyCapacity = 1000; // Target daily processing capacity
    const currentThroughput = status.queue.statistics.queueThroughput;
    const projectedDaily = currentThroughput * 24;
    const utilizationRate = (projectedDaily / dailyCapacity) * 100;

    res.json({
      available: true,
      capacity: {
        dailyTarget: dailyCapacity,
        currentThroughput: currentThroughput,
        projectedDaily: Math.round(projectedDaily),
        utilizationRate: Math.round(utilizationRate),
        queueSize: status.queue.totalQueued,
        processing: status.queue.processing,
        canAcceptMore: status.queue.totalQueued < 500 // Conservative threshold
      },
      apiLimits: {
        requestsToday: status.queue.statistics.totalProcessed || 0,
        dailyLimit: 200,
        remainingToday: Math.max(0, 200 - (status.queue.statistics.totalProcessed || 0))
      },
      enhanced: true
    });

  } catch (error) {
    console.error('Capacity check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Estimate processing time for a given number of resumes
 * GET /api/enhanced/estimate/:count
 */
router.get('/estimate/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count);
    
    if (isNaN(count) || count <= 0) {
      return res.status(400).json({ error: 'Invalid count parameter' });
    }

    if (!processingSystem) {
      // Fallback estimation
      return res.json({
        estimated: true,
        estimatedTime: `${Math.ceil(count / 20)} hours`,
        note: 'Estimation based on fallback system',
        enhanced: false
      });
    }

    const estimatedTime = processingSystem.estimateCompletionTime(count);
    const status = processingSystem.getStatus();
    
    res.json({
      estimated: true,
      resumeCount: count,
      estimatedTime,
      currentThroughput: status.queue.statistics.queueThroughput,
      queuePosition: status.queue.totalQueued,
      enhanced: true
    });

  } catch (error) {
    console.error('Estimation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Middleware to check if enhanced processing is available
 */
router.use('/check-availability', (req, res) => {
  res.json({
    available: !!processingSystem,
    features: {
      batchProcessing: !!processingSystem,
      queueManagement: !!processingSystem,
      realTimeMonitoring: !!processingSystem,
      textOptimization: !!processingSystem,
      intelligentBatching: !!processingSystem
    },
    message: processingSystem 
      ? 'Enhanced processing system is available'
      : 'Enhanced processing system is not available. Using fallback mode.'
  });
});

module.exports = router;
