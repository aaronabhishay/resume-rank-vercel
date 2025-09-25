const QueueManager = require('./queueManager');
const BatchManager = require('./batchManager');
const FileProcessor = require('../processors/fileProcessor');
const ResumeParser = require('../parsers/resumeParser');
const MODEL_CONFIG = require('../../model-config');

/**
 * Background Resume Processing Service
 * Orchestrates the entire resume processing pipeline
 * Handles continuous processing, monitoring, and error recovery
 */

class BackgroundProcessor {
  constructor(geminiClient, options = {}) {
    this.options = {
      processingInterval: 10000, // 10 seconds
      maxConcurrentBatches: 1, // Process one batch at a time for rate limiting
      enableScheduling: true,
      businessHours: {
        start: 8, // 8 AM
        end: 18,  // 6 PM
        timezone: 'America/Los_Angeles' // For Gemini rate limit resets
      },
      healthCheckInterval: 60000, // 1 minute
      ...options
    };

    // Initialize components
    this.geminiClient = geminiClient;
    this.queueManager = new QueueManager();
    this.batchManager = new BatchManager();
    this.fileProcessor = new FileProcessor();
    this.resumeParser = new ResumeParser();

    // Processing state
    this.isRunning = false;
    this.isPaused = false;
    this.currentBatch = null;
    this.processingStartTime = null;
    
    // Timers
    this.processingTimer = null;
    this.healthCheckTimer = null;

    // Statistics
    this.stats = {
      uptime: 0,
      totalBatchesProcessed: 0,
      totalResumesProcessed: 0,
      averageBatchTime: 0,
      errorRate: 0,
      lastProcessedAt: null,
      systemHealth: 'starting'
    };

    // Event subscribers
    this.eventHandlers = new Map();

    this.initialize();
  }

  /**
   * Initialize the background processor
   */
  async initialize() {
    try {
      console.log('Initializing Background Processor...');
      
      // Wait for queue manager to initialize
      if (!this.queueManager.isInitialized) {
        await new Promise(resolve => {
          const checkInit = setInterval(() => {
            if (this.queueManager.isInitialized) {
              clearInterval(checkInit);
              resolve();
            }
          }, 100);
        });
      }

      // Subscribe to queue events
      this.queueManager.subscribe('itemCompleted', (data) => {
        this.emit('resume_completed', data);
      });

      this.queueManager.subscribe('itemFailed', (data) => {
        this.emit('resume_failed', data);
      });

      this.queueManager.subscribe('batchDequeued', (data) => {
        this.emit('batch_started', data);
      });

      console.log('Background Processor initialized successfully');
      this.stats.systemHealth = 'ready';
      
    } catch (error) {
      console.error('Failed to initialize Background Processor:', error);
      this.stats.systemHealth = 'error';
      throw error;
    }
  }

  /**
   * Start the background processing service
   */
  async start() {
    if (this.isRunning) {
      console.log('Background Processor is already running');
      return;
    }

    console.log('Starting Background Processor...');
    this.isRunning = true;
    this.isPaused = false;
    this.processingStartTime = Date.now();
    this.stats.systemHealth = 'running';

    // Start processing loop
    this.startProcessingLoop();
    
    // Start health monitoring
    this.startHealthMonitoring();

    console.log('Background Processor started successfully');
    this.emit('processor_started', { startTime: this.processingStartTime });
  }

  /**
   * Stop the background processing service
   */
  async stop() {
    console.log('Stopping Background Processor...');
    
    this.isRunning = false;
    
    // Clear timers
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Wait for current batch to complete
    if (this.currentBatch) {
      console.log('Waiting for current batch to complete...');
      await this.waitForBatchCompletion();
    }

    // Shutdown queue manager
    await this.queueManager.shutdown();

    this.stats.systemHealth = 'stopped';
    this.stats.uptime = Date.now() - this.processingStartTime;

    console.log('Background Processor stopped');
    this.emit('processor_stopped', { uptime: this.stats.uptime });
  }

  /**
   * Pause processing (can be resumed)
   */
  pause() {
    if (!this.isRunning) return;
    
    this.isPaused = true;
    this.stats.systemHealth = 'paused';
    
    console.log('Background Processor paused');
    this.emit('processor_paused', {});
  }

  /**
   * Resume processing
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    
    this.isPaused = false;
    this.stats.systemHealth = 'running';
    
    console.log('Background Processor resumed');
    this.emit('processor_resumed', {});
  }

  /**
   * Add resumes to processing queue
   * @param {Array|Object} resumes - Resume data
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Queue item IDs
   */
  async queueResumes(resumes, options = {}) {
    try {
      const queueIds = await this.queueManager.enqueue(resumes, options);
      
      console.log(`Queued ${queueIds.length} resumes for processing`);
      this.emit('resumes_queued', { count: queueIds.length, ids: queueIds });
      
      return queueIds;
    } catch (error) {
      console.error('Failed to queue resumes:', error);
      throw error;
    }
  }

  /**
   * Start the main processing loop
   */
  startProcessingLoop() {
    this.processingTimer = setInterval(async () => {
      if (!this.isRunning || this.isPaused || this.currentBatch) {
        return;
      }

      // Check if we should process based on business hours
      if (this.options.enableScheduling && !this.isBusinessHours()) {
        return;
      }

      await this.processNextBatch();
    }, this.options.processingInterval);
  }

  /**
   * Process the next batch of resumes
   */
  async processNextBatch() {
    try {
      // Get next batch from queue
      const batchItems = this.queueManager.dequeue(20); // Try to get up to 20 items
      
      if (batchItems.length === 0) {
        return; // No items to process
      }

      this.currentBatch = {
        id: `batch_${Date.now()}`,
        items: batchItems,
        startTime: Date.now()
      };

      console.log(`Starting batch processing: ${batchItems.length} resumes`);

      // Process the batch
      await this.processBatch(this.currentBatch);

    } catch (error) {
      console.error('Error in batch processing:', error);
      
      if (this.currentBatch) {
        // Mark all items in current batch as failed
        for (const item of this.currentBatch.items) {
          await this.queueManager.markFailed(item.id, error);
        }
      }
      
      this.emit('batch_failed', { 
        batchId: this.currentBatch?.id, 
        error: error.message 
      });
    } finally {
      this.currentBatch = null;
    }
  }

  /**
   * Process a batch of resumes
   * @param {Object} batch - Batch to process
   */
  async processBatch(batch) {
    const startTime = Date.now();
    
    try {
      // Step 1: Process files and extract text
      const processedResumes = await this.processFiles(batch.items);
      
      // Step 2: Create optimized batches for Gemini API
      const optimizedBatches = await this.batchManager.createBatches(
        processedResumes,
        batch.items[0].jobDescription || ''
      );

      // Step 3: Process each optimized batch with Gemini
      const allResults = [];
      for (const optimizedBatch of optimizedBatches) {
        const results = await this.processGeminiBatch(optimizedBatch);
        allResults.push(...results);
      }

      // Step 4: Parse and validate results
      const parsedResults = await this.parseResults(allResults);

      // Step 5: Mark items as completed
      for (let i = 0; i < batch.items.length; i++) {
        const item = batch.items[i];
        const result = parsedResults[i];
        
        if (result && !result.error) {
          await this.queueManager.markCompleted(item.id, result);
        } else {
          await this.queueManager.markFailed(item.id, new Error(result?.error || 'Processing failed'));
        }
      }

      // Update statistics
      const processingTime = Date.now() - startTime;
      this.updateBatchStats(batch.items.length, processingTime);
      
      console.log(`Batch completed in ${processingTime}ms: ${batch.items.length} resumes`);
      
      this.emit('batch_completed', {
        batchId: batch.id,
        itemCount: batch.items.length,
        processingTime,
        successCount: parsedResults.filter(r => r && !r.error).length
      });

    } catch (error) {
      console.error(`Batch processing failed:`, error);
      throw error;
    }
  }

  /**
   * Process files and extract text
   * @param {Array} items - Queue items
   * @returns {Promise<Array>} Processed resume data
   */
  async processFiles(items) {
    const processed = [];
    
    for (const item of items) {
      try {
        if (item.resume.text) {
          // Text already extracted
          processed.push({
            ...item.resume,
            queueItemId: item.id
          });
        } else if (item.resume.buffer || item.resume.file) {
          // Need to extract text from file
          const result = await this.fileProcessor.processFile(
            item.resume.buffer || item.resume.file,
            item.metadata.fileName,
            item.metadata.mimeType
          );
          
          processed.push({
            ...item.resume,
            text: result.text,
            queueItemId: item.id,
            fileProcessing: result
          });
        } else {
          throw new Error('No text or file data available');
        }
      } catch (error) {
        console.error(`Failed to process file for item ${item.id}:`, error);
        processed.push({
          ...item.resume,
          queueItemId: item.id,
          error: error.message
        });
      }
    }
    
    return processed;
  }

  /**
   * Process batch with Gemini API
   * @param {Object} batch - Optimized batch
   * @returns {Promise<Array>} Gemini API results
   */
  async processGeminiBatch(batch) {
    try {
      console.log(`Processing Gemini batch: ${batch.size} resumes, ~${batch.estimatedTokens} tokens`);

      // Create the prompt for batch processing
      const prompt = this.createBatchPrompt(batch.resumes, batch.resumes[0].jobDescription);
      
      // Call Gemini API
      const model = this.geminiClient.getGenerativeModel({
        model: MODEL_CONFIG.model,
        generationConfig: {
          ...MODEL_CONFIG.generationConfig,
          maxOutputTokens: 4096 // Increase for batch processing
        }
      });

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse batch response
      return this.parseBatchResponse(response, batch.resumes);

    } catch (error) {
      console.error('Gemini API batch processing failed:', error);
      
      // Return error for all resumes in batch
      return batch.resumes.map(resume => ({
        queueItemId: resume.queueItemId,
        error: error.message
      }));
    }
  }

  /**
   * Create prompt for batch processing
   * @param {Array} resumes - Resume data
   * @param {string} jobDescription - Job description
   * @returns {string} Formatted prompt
   */
  createBatchPrompt(resumes, jobDescription = '') {
    const resumeTexts = resumes.map((resume, index) => 
      `===== RESUME ${index + 1} =====\n${resume.text}\n`
    ).join('\n');

    return `
You are a professional resume analyzer. Analyze the following ${resumes.length} resumes and extract structured information for each.

JOB DESCRIPTION:
${jobDescription || 'General position evaluation'}

RESUMES TO ANALYZE:
${resumeTexts}

For each resume, return a JSON object with this exact structure:
{
  "resume_1": {
    "name": "Full name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, state/country",
    "linkedin": "linkedin profile URL",
    "github": "github profile URL",
    "summary": "brief professional summary",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
      {
        "title": "Job title",
        "company": "Company name",
        "startDate": "YYYY-MM",
        "endDate": "YYYY-MM or present",
        "description": "job description",
        "achievements": ["achievement1", "achievement2"]
      }
    ],
    "education": [
      {
        "degree": "degree type",
        "field": "field of study",
        "institution": "school name",
        "graduationDate": "YYYY"
      }
    ],
    "projects": [
      {
        "name": "project name",
        "description": "project description",
        "technologies": ["tech1", "tech2"]
      }
    ]
  },
  "resume_2": { ... },
  ...
}

Return only the JSON object, no additional text. Ensure all dates are in YYYY-MM format.
`;
  }

  /**
   * Parse batch response from Gemini
   * @param {string} response - Gemini response
   * @param {Array} resumes - Original resume data
   * @returns {Array} Parsed results
   */
  parseBatchResponse(response, resumes) {
    try {
      const jsonData = JSON.parse(response);
      const results = [];

      for (let i = 0; i < resumes.length; i++) {
        const resumeKey = `resume_${i + 1}`;
        const resumeData = jsonData[resumeKey];
        
        if (resumeData) {
          results.push({
            queueItemId: resumes[i].queueItemId,
            data: resumeData,
            raw: response
          });
        } else {
          results.push({
            queueItemId: resumes[i].queueItemId,
            error: `No data found for resume ${i + 1}`
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Failed to parse batch response:', error);
      
      // Return error for all resumes
      return resumes.map(resume => ({
        queueItemId: resume.queueItemId,
        error: 'Failed to parse API response'
      }));
    }
  }

  /**
   * Parse results using ResumeParser
   * @param {Array} results - Raw results from Gemini
   * @returns {Promise<Array>} Parsed results
   */
  async parseResults(results) {
    const parsed = [];
    
    for (const result of results) {
      if (result.error) {
        parsed.push(result);
        continue;
      }

      try {
        const parsedData = await this.resumeParser.parseResponse(
          JSON.stringify(result.data),
          { source: 'batch_processing' }
        );
        
        parsed.push({
          queueItemId: result.queueItemId,
          data: parsedData
        });
      } catch (error) {
        parsed.push({
          queueItemId: result.queueItemId,
          error: `Parsing failed: ${error.message}`
        });
      }
    }
    
    return parsed;
  }

  /**
   * Check if current time is within business hours
   * @returns {boolean} True if within business hours
   */
  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    
    return hour >= this.options.businessHours.start && 
           hour < this.options.businessHours.end;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.options.healthCheckInterval);
  }

  /**
   * Perform system health check
   */
  performHealthCheck() {
    const queueStatus = this.queueManager.getStatus();
    let health = 'healthy';
    const issues = [];

    // Check queue sizes
    const totalQueued = queueStatus.totalQueued;
    if (totalQueued > 1000) {
      health = 'warning';
      issues.push('High queue volume');
    }

    // Check processing rate
    if (queueStatus.statistics.queueThroughput < 5) {
      health = 'warning';
      issues.push('Low processing rate');
    }

    // Check error rate
    const errorRate = this.calculateErrorRate();
    if (errorRate > 0.2) {
      health = 'critical';
      issues.push('High error rate');
    }

    this.stats.systemHealth = health;
    
    if (issues.length > 0) {
      this.emit('health_warning', { health, issues });
    }
  }

  /**
   * Calculate current error rate
   * @returns {number} Error rate (0-1)
   */
  calculateErrorRate() {
    const queueStats = this.queueManager.getStats();
    const total = queueStats.statistics.totalProcessed;
    const failed = queueStats.statistics.totalFailed;
    
    return total > 0 ? failed / total : 0;
  }

  /**
   * Update batch processing statistics
   * @param {number} itemCount - Number of items processed
   * @param {number} processingTime - Time taken in milliseconds
   */
  updateBatchStats(itemCount, processingTime) {
    this.stats.totalBatchesProcessed++;
    this.stats.totalResumesProcessed += itemCount;
    this.stats.lastProcessedAt = new Date().toISOString();
    
    // Update average batch time
    const currentAvg = this.stats.averageBatchTime;
    const batchCount = this.stats.totalBatchesProcessed;
    this.stats.averageBatchTime = ((currentAvg * (batchCount - 1)) + processingTime) / batchCount;
    
    // Update uptime
    if (this.processingStartTime) {
      this.stats.uptime = Date.now() - this.processingStartTime;
    }
  }

  /**
   * Wait for current batch to complete
   */
  async waitForBatchCompletion() {
    return new Promise((resolve) => {
      const checkCompletion = setInterval(() => {
        if (!this.currentBatch) {
          clearInterval(checkCompletion);
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * Get current system status
   * @returns {Object} System status
   */
  getStatus() {
    const queueStatus = this.queueManager.getStatus();
    
    return {
      processor: {
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        systemHealth: this.stats.systemHealth,
        uptime: this.stats.uptime,
        currentBatch: this.currentBatch ? {
          id: this.currentBatch.id,
          itemCount: this.currentBatch.items.length,
          startTime: this.currentBatch.startTime
        } : null
      },
      queue: queueStatus,
      statistics: this.stats,
      batchManager: this.batchManager.getStats(),
      resumeParser: this.resumeParser.getStats()
    };
  }

  /**
   * Subscribe to events
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Emit events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Export processing statistics
   * @returns {Object} Detailed statistics
   */
  exportStats() {
    return {
      timestamp: new Date().toISOString(),
      processor: this.stats,
      queue: this.queueManager.getStats(),
      batchManager: this.batchManager.getStats(),
      resumeParser: this.resumeParser.getStats(),
      configuration: this.options
    };
  }
}

module.exports = BackgroundProcessor;
