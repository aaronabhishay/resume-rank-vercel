const BackgroundProcessor = require('./backgroundProcessor');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Resume Processing System Integration
 * Main entry point for the enhanced resume processing system
 * Integrates with existing infrastructure and provides unified API
 */

class ResumeProcessingSystem {
  constructor(options = {}) {
    this.options = {
      autoStart: true,
      enableMonitoring: true,
      enableScheduling: true,
      ...options
    };

    this.processor = null;
    this.isInitialized = false;
    this.geminiClient = null;
  }

  /**
   * Initialize the processing system
   * @param {string} geminiApiKey - Gemini API key
   * @returns {Promise<void>}
   */
  async initialize(geminiApiKey) {
    try {
      console.log('Initializing Resume Processing System...');

      // Initialize Gemini client
      if (!geminiApiKey) {
        throw new Error('Gemini API key is required');
      }

      this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
      console.log('Gemini API client initialized');

      // Initialize background processor
      this.processor = new BackgroundProcessor(this.geminiClient, this.options);
      
      // Set up event handlers
      this.setupEventHandlers();

      if (this.options.autoStart) {
        await this.processor.start();
      }

      this.isInitialized = true;
      console.log('Resume Processing System initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Resume Processing System:', error);
      throw error;
    }
  }

  /**
   * Set up event handlers for monitoring and logging
   */
  setupEventHandlers() {
    this.processor.on('processor_started', (data) => {
      console.log('🚀 Background processor started');
    });

    this.processor.on('processor_stopped', (data) => {
      console.log('⏹️ Background processor stopped');
    });

    this.processor.on('batch_completed', (data) => {
      console.log(`✅ Batch completed: ${data.itemCount} resumes in ${data.processingTime}ms`);
    });

    this.processor.on('batch_failed', (data) => {
      console.error(`❌ Batch failed: ${data.error}`);
    });

    this.processor.on('resume_completed', (data) => {
      console.log(`📄 Resume completed: ${data.fileName}`);
    });

    this.processor.on('resume_failed', (data) => {
      console.error(`❌ Resume failed: ${data.fileName} - ${data.error}`);
    });

    this.processor.on('health_warning', (data) => {
      console.warn(`⚠️ Health warning: ${data.issues.join(', ')}`);
    });
  }

  /**
   * Process resumes from Google Drive (integrates with existing system)
   * @param {string} folderId - Google Drive folder ID
   * @param {string} jobDescription - Job description
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Processing results
   */
  async processGoogleDriveFolder(folderId, jobDescription, options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    try {
      console.log(`Processing Google Drive folder: ${folderId}`);

      // This would integrate with your existing Google Drive code
      // For now, return a placeholder that shows the integration point
      
      const processingOptions = {
        priority: options.priority || 'normal',
        jobDescription,
        weights: options.weights || {},
        source: 'google_drive',
        ...options
      };

      // In your existing code, you would:
      // 1. Get resumes from Google Drive using your existing function
      // 2. Queue them for processing
      // 3. Return tracking information

      console.log('Google Drive integration placeholder - connect to existing getResumesFromDrive function');
      
      return {
        message: 'Resumes queued for processing',
        estimatedCompletionTime: this.estimateCompletionTime(100), // Placeholder count
        trackingUrl: '/api/monitoring/status'
      };

    } catch (error) {
      console.error('Failed to process Google Drive folder:', error);
      throw error;
    }
  }

  /**
   * Process individual resume files
   * @param {Array} files - File objects with buffer/path data
   * @param {string} jobDescription - Job description
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Queue item IDs
   */
  async processResumeFiles(files, jobDescription, options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    try {
      console.log(`Processing ${files.length} resume files`);

      // Convert files to resume objects
      const resumes = files.map(file => ({
        name: file.name,
        buffer: file.buffer,
        mimeType: file.mimeType,
        size: file.size
      }));

      // Queue for processing
      const queueIds = await this.processor.queueResumes(resumes, {
        priority: options.priority || 'normal',
        jobDescription,
        weights: options.weights || {},
        source: 'file_upload'
      });

      return {
        queueIds,
        estimatedCompletionTime: this.estimateCompletionTime(files.length),
        trackingUrl: '/api/monitoring/status'
      };

    } catch (error) {
      console.error('Failed to process resume files:', error);
      throw error;
    }
  }

  /**
   * Get processing status and statistics
   * @returns {Object} Current system status
   */
  getStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    return this.processor.getStatus();
  }

  /**
   * Get queue details
   * @param {Object} filters - Filtering options
   * @returns {Object} Queue details
   */
  getQueueDetails(filters = {}) {
    if (!this.isInitialized) {
      return { error: 'System not initialized' };
    }

    return this.processor.queueManager.getQueueDetails(filters);
  }

  /**
   * Estimate completion time for given number of resumes
   * @param {number} resumeCount - Number of resumes
   * @returns {string} Estimated completion time
   */
  estimateCompletionTime(resumeCount) {
    if (!this.isInitialized) {
      return 'Unknown';
    }

    const status = this.processor.getStatus();
    const throughput = status.queue.statistics.queueThroughput || 20; // Default 20/hour
    
    const hoursNeeded = resumeCount / throughput;
    
    if (hoursNeeded < 1) {
      return `${Math.ceil(hoursNeeded * 60)} minutes`;
    } else if (hoursNeeded < 24) {
      return `${hoursNeeded.toFixed(1)} hours`;
    } else {
      return `${(hoursNeeded / 24).toFixed(1)} days`;
    }
  }

  /**
   * Pause processing
   */
  pause() {
    if (this.processor) {
      this.processor.pause();
    }
  }

  /**
   * Resume processing
   */
  resume() {
    if (this.processor) {
      this.processor.resume();
    }
  }

  /**
   * Stop the processing system
   */
  async stop() {
    if (this.processor) {
      await this.processor.stop();
    }
  }

  /**
   * Export system statistics
   * @returns {Object} Detailed statistics
   */
  exportStatistics() {
    if (!this.isInitialized) {
      return { error: 'System not initialized' };
    }

    return this.processor.exportStats();
  }

  /**
   * Health check endpoint
   * @returns {Object} Health status
   */
  healthCheck() {
    if (!this.isInitialized) {
      return {
        status: 'unhealthy',
        reason: 'System not initialized'
      };
    }

    const systemStatus = this.processor.getStatus();
    
    return {
      status: systemStatus.processor.systemHealth === 'running' ? 'healthy' : 'unhealthy',
      uptime: systemStatus.processor.uptime,
      queueSize: systemStatus.queue.totalQueued,
      processing: systemStatus.queue.processing,
      throughput: systemStatus.queue.statistics.queueThroughput,
      timestamp: new Date().toISOString()
    };
  }
}

// Create global instance
let globalInstance = null;

/**
 * Get or create global instance
 * @param {Object} options - Initialization options
 * @returns {ResumeProcessingSystem} Global instance
 */
function getInstance(options = {}) {
  if (!globalInstance) {
    globalInstance = new ResumeProcessingSystem(options);
  }
  return globalInstance;
}

/**
 * Initialize the global instance
 * @param {string} geminiApiKey - Gemini API key
 * @param {Object} options - Options
 * @returns {Promise<ResumeProcessingSystem>} Initialized instance
 */
async function initialize(geminiApiKey, options = {}) {
  const instance = getInstance(options);
  
  if (!instance.isInitialized) {
    await instance.initialize(geminiApiKey);
  }
  
  return instance;
}

module.exports = {
  ResumeProcessingSystem,
  getInstance,
  initialize
};
