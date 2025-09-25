const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Queue Management System for Resume Processing
 * Handles 1,000+ resumes daily with priority queuing and persistence
 * Manages processing workflow and retry logic
 */

class QueueManager {
  constructor(options = {}) {
    this.options = {
      queueDir: path.join(process.cwd(), 'data', 'queue'),
      maxQueueSize: 2000,
      maxRetries: 3,
      retryDelayMs: 60000, // 1 minute
      processingTimeout: 300000, // 5 minutes
      priorityLevels: ['urgent', 'high', 'normal', 'low'],
      persistInterval: 30000, // 30 seconds
      cleanupInterval: 3600000, // 1 hour
      ...options
    };

    // In-memory queues
    this.queues = {
      urgent: [],
      high: [],
      normal: [],
      low: []
    };

    // Processing state
    this.processing = new Map(); // Currently processing items
    this.completed = new Map(); // Completed items (last 1000)
    this.failed = new Map(); // Failed items (last 500)
    
    // Statistics
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalCompleted: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      queueThroughput: 0, // resumes per hour
      lastReset: new Date().toISOString()
    };

    // Internal state
    this.isInitialized = false;
    this.persistTimer = null;
    this.cleanupTimer = null;
    this.subscribers = new Map(); // Event subscribers

    this.initialize();
  }

  /**
   * Initialize the queue manager
   */
  async initialize() {
    try {
      // Ensure queue directory exists
      await fs.mkdir(this.options.queueDir, { recursive: true });
      
      // Load persisted queues
      await this.loadPersistedQueues();
      
      // Start background tasks
      this.startPeristenceTimer();
      this.startCleanupTimer();
      
      this.isInitialized = true;
      console.log('Queue Manager initialized successfully');
      
      this.emit('initialized', this.getStatus());
      
    } catch (error) {
      console.error('Failed to initialize Queue Manager:', error);
      throw error;
    }
  }

  /**
   * Add resume(s) to processing queue
   * @param {Array|Object} resumes - Resume(s) to queue
   * @param {Object} options - Queuing options
   * @returns {Promise<Array>} Queue item IDs
   */
  async enqueue(resumes, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Queue Manager not initialized');
    }

    const items = Array.isArray(resumes) ? resumes : [resumes];
    const queueOptions = {
      priority: 'normal',
      jobDescription: '',
      weights: {},
      source: 'api',
      batchId: null,
      ...options
    };

    const queuedItems = [];

    for (const resume of items) {
      // Check queue capacity
      if (this.getTotalQueueSize() >= this.options.maxQueueSize) {
        throw new Error(`Queue capacity exceeded. Maximum: ${this.options.maxQueueSize}`);
      }

      // Generate unique ID
      const itemId = this.generateId();
      
      // Check for duplicates
      const isDuplicate = await this.checkDuplicate(resume);
      if (isDuplicate) {
        console.warn(`Duplicate resume detected: ${resume.name || itemId}`);
        continue;
      }

      // Create queue item
      const queueItem = {
        id: itemId,
        resume: resume,
        priority: queueOptions.priority,
        jobDescription: queueOptions.jobDescription,
        weights: queueOptions.weights,
        source: queueOptions.source,
        batchId: queueOptions.batchId,
        status: 'queued',
        retries: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processingStarted: null,
        processingCompleted: null,
        error: null,
        result: null,
        metadata: {
          fileName: resume.name || resume.fileName,
          fileSize: resume.size || 0,
          mimeType: resume.mimeType || 'application/pdf'
        }
      };

      // Add to appropriate priority queue
      this.queues[queueOptions.priority].push(queueItem);
      queuedItems.push(itemId);
      
      this.stats.totalQueued++;
      
      console.log(`Queued resume: ${queueItem.metadata.fileName} (ID: ${itemId}, Priority: ${queueOptions.priority})`);
    }

    this.emit('itemsQueued', {
      count: queuedItems.length,
      items: queuedItems,
      queueStatus: this.getStatus()
    });

    return queuedItems;
  }

  /**
   * Get next batch of items to process
   * @param {number} batchSize - Desired batch size
   * @returns {Array} Batch of queue items
   */
  dequeue(batchSize = 10) {
    const batch = [];
    
    // Process by priority order
    for (const priority of this.options.priorityLevels) {
      const queue = this.queues[priority];
      
      while (queue.length > 0 && batch.length < batchSize) {
        const item = queue.shift();
        
        // Update item status
        item.status = 'processing';
        item.processingStarted = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        
        // Move to processing map
        this.processing.set(item.id, item);
        batch.push(item);
      }
      
      if (batch.length >= batchSize) break;
    }

    if (batch.length > 0) {
      console.log(`Dequeued batch of ${batch.length} items for processing`);
      this.emit('batchDequeued', {
        batchSize: batch.length,
        items: batch.map(item => ({
          id: item.id,
          fileName: item.metadata.fileName,
          priority: item.priority
        }))
      });
    }

    return batch;
  }

  /**
   * Mark item as completed
   * @param {string} itemId - Item ID
   * @param {Object} result - Processing result
   */
  async markCompleted(itemId, result) {
    const item = this.processing.get(itemId);
    if (!item) {
      throw new Error(`Item not found in processing: ${itemId}`);
    }

    item.status = 'completed';
    item.result = result;
    item.processingCompleted = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    
    // Calculate processing time
    const processingTime = new Date(item.processingCompleted) - new Date(item.processingStarted);
    item.processingTime = processingTime;

    // Move to completed map
    this.processing.delete(itemId);
    this.completed.set(itemId, item);
    
    // Update statistics
    this.stats.totalProcessed++;
    this.stats.totalCompleted++;
    this.updateAverageProcessingTime(processingTime);
    
    // Limit completed items to prevent memory issues
    if (this.completed.size > 1000) {
      const oldestKey = this.completed.keys().next().value;
      this.completed.delete(oldestKey);
    }

    console.log(`Completed processing: ${item.metadata.fileName} (${processingTime}ms)`);
    
    this.emit('itemCompleted', {
      itemId,
      fileName: item.metadata.fileName,
      processingTime,
      result
    });
  }

  /**
   * Mark item as failed
   * @param {string} itemId - Item ID
   * @param {Error} error - Error that occurred
   */
  async markFailed(itemId, error) {
    const item = this.processing.get(itemId);
    if (!item) {
      throw new Error(`Item not found in processing: ${itemId}`);
    }

    item.error = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    item.retries++;
    item.updatedAt = new Date().toISOString();

    // Check if we should retry
    if (item.retries < this.options.maxRetries) {
      item.status = 'retrying';
      
      // Move back to queue after delay
      setTimeout(() => {
        item.status = 'queued';
        this.processing.delete(itemId);
        this.queues[item.priority].unshift(item); // Add to front for retry
        
        console.log(`Retrying item: ${item.metadata.fileName} (Retry ${item.retries}/${this.options.maxRetries})`);
        
        this.emit('itemRetrying', {
          itemId,
          fileName: item.metadata.fileName,
          retryCount: item.retries,
          error: error.message
        });
        
      }, this.options.retryDelayMs);
      
    } else {
      // Max retries exceeded
      item.status = 'failed';
      item.processingCompleted = new Date().toISOString();
      
      this.processing.delete(itemId);
      this.failed.set(itemId, item);
      
      this.stats.totalProcessed++;
      this.stats.totalFailed++;
      
      // Limit failed items
      if (this.failed.size > 500) {
        const oldestKey = this.failed.keys().next().value;
        this.failed.delete(oldestKey);
      }

      console.error(`Failed processing after ${item.retries} retries: ${item.metadata.fileName}`);
      
      this.emit('itemFailed', {
        itemId,
        fileName: item.metadata.fileName,
        retryCount: item.retries,
        error: error.message
      });
    }
  }

  /**
   * Get queue status and statistics
   * @returns {Object} Current queue status
   */
  getStatus() {
    const queueSizes = {};
    let totalQueued = 0;
    
    for (const [priority, queue] of Object.entries(this.queues)) {
      queueSizes[priority] = queue.length;
      totalQueued += queue.length;
    }

    return {
      queues: queueSizes,
      totalQueued,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      statistics: {
        ...this.stats,
        queueThroughput: this.calculateThroughput()
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get detailed queue information
   * @param {Object} filters - Filtering options
   * @returns {Object} Detailed queue information
   */
  getQueueDetails(filters = {}) {
    const result = {
      queued: [],
      processing: [],
      completed: [],
      failed: []
    };

    // Get queued items
    for (const [priority, queue] of Object.entries(this.queues)) {
      result.queued.push(...queue.map(item => this.formatItemSummary(item)));
    }

    // Get processing items
    result.processing = Array.from(this.processing.values()).map(item => this.formatItemSummary(item));

    // Get completed items (last 50)
    const completedItems = Array.from(this.completed.values()).slice(-50);
    result.completed = completedItems.map(item => this.formatItemSummary(item));

    // Get failed items (last 20)
    const failedItems = Array.from(this.failed.values()).slice(-20);
    result.failed = failedItems.map(item => this.formatItemSummary(item));

    // Apply filters if provided
    if (filters.status) {
      const status = filters.status;
      if (result[status]) {
        return { [status]: result[status] };
      }
    }

    if (filters.priority) {
      result.queued = result.queued.filter(item => item.priority === filters.priority);
    }

    return result;
  }

  /**
   * Check for duplicate resumes
   * @param {Object} resume - Resume to check
   * @returns {Promise<boolean>} True if duplicate found
   */
  async checkDuplicate(resume) {
    // Create hash of resume content for duplicate detection
    const hash = this.generateResumeHash(resume);
    
    // Check in all queues and processing
    const allItems = [
      ...Object.values(this.queues).flat(),
      ...Array.from(this.processing.values()),
      ...Array.from(this.completed.values()).slice(-100) // Check recent completed
    ];

    return allItems.some(item => {
      const itemHash = this.generateResumeHash(item.resume);
      return itemHash === hash;
    });
  }

  /**
   * Generate hash for resume content
   * @param {Object} resume - Resume object
   * @returns {string} Hash string
   */
  generateResumeHash(resume) {
    const content = resume.text || resume.content || resume.name || '';
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get total queue size across all priorities
   * @returns {number} Total items in queue
   */
  getTotalQueueSize() {
    return Object.values(this.queues).reduce((total, queue) => total + queue.length, 0);
  }

  /**
   * Calculate processing throughput
   * @returns {number} Items per hour
   */
  calculateThroughput() {
    const hourAgo = new Date(Date.now() - 3600000);
    const recentCompleted = Array.from(this.completed.values())
      .filter(item => new Date(item.processingCompleted) > hourAgo);
    
    return recentCompleted.length;
  }

  /**
   * Update average processing time
   * @param {number} processingTime - Time in milliseconds
   */
  updateAverageProcessingTime(processingTime) {
    const currentAvg = this.stats.averageProcessingTime;
    const processed = this.stats.totalProcessed;
    
    this.stats.averageProcessingTime = ((currentAvg * (processed - 1)) + processingTime) / processed;
  }

  /**
   * Format item for summary display
   * @param {Object} item - Queue item
   * @returns {Object} Formatted summary
   */
  formatItemSummary(item) {
    return {
      id: item.id,
      fileName: item.metadata.fileName,
      status: item.status,
      priority: item.priority,
      retries: item.retries,
      createdAt: item.createdAt,
      processingStarted: item.processingStarted,
      processingCompleted: item.processingCompleted,
      processingTime: item.processingTime,
      error: item.error?.message || null
    };
  }

  /**
   * Load persisted queues from disk
   */
  async loadPersistedQueues() {
    try {
      const queueFile = path.join(this.options.queueDir, 'queues.json');
      const statsFile = path.join(this.options.queueDir, 'stats.json');
      
      // Load queues
      try {
        const queueData = await fs.readFile(queueFile, 'utf8');
        const savedQueues = JSON.parse(queueData);
        
        for (const [priority, items] of Object.entries(savedQueues)) {
          if (this.queues[priority]) {
            this.queues[priority] = items;
          }
        }
        
        console.log('Loaded persisted queues');
      } catch (error) {
        console.log('No persisted queues found, starting fresh');
      }
      
      // Load stats
      try {
        const statsData = await fs.readFile(statsFile, 'utf8');
        const savedStats = JSON.parse(statsData);
        this.stats = { ...this.stats, ...savedStats };
        
        console.log('Loaded persisted statistics');
      } catch (error) {
        console.log('No persisted statistics found, starting fresh');
      }
      
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  }

  /**
   * Persist queues to disk
   */
  async persistQueues() {
    try {
      const queueFile = path.join(this.options.queueDir, 'queues.json');
      const statsFile = path.join(this.options.queueDir, 'stats.json');
      
      // Save queues
      await fs.writeFile(queueFile, JSON.stringify(this.queues, null, 2));
      
      // Save stats
      await fs.writeFile(statsFile, JSON.stringify(this.stats, null, 2));
      
      console.log('Persisted queue data to disk');
      
    } catch (error) {
      console.error('Error persisting queue data:', error);
    }
  }

  /**
   * Start persistence timer
   */
  startPeristenceTimer() {
    this.persistTimer = setInterval(() => {
      this.persistQueues();
    }, this.options.persistInterval);
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    const dayAgo = new Date(Date.now() - 86400000); // 24 hours ago
    
    // Clean old completed items
    for (const [id, item] of this.completed.entries()) {
      if (new Date(item.processingCompleted) < dayAgo) {
        this.completed.delete(id);
      }
    }
    
    // Clean old failed items
    for (const [id, item] of this.failed.entries()) {
      if (new Date(item.updatedAt) < dayAgo) {
        this.failed.delete(id);
      }
    }
    
    console.log('Cleanup completed - removed old items from memory');
  }

  /**
   * Event subscription system
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
  }

  /**
   * Emit events to subscribers
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Shutdown queue manager
   */
  async shutdown() {
    console.log('Shutting down Queue Manager...');
    
    // Clear timers
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Persist final state
    await this.persistQueues();
    
    console.log('Queue Manager shutdown complete');
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalCompleted: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      queueThroughput: 0,
      lastReset: new Date().toISOString()
    };
    
    console.log('Statistics reset');
    this.emit('statsReset', this.stats);
  }
}

module.exports = QueueManager;
