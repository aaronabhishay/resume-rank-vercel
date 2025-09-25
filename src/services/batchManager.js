const TextOptimizer = require('../processors/textOptimizer');

/**
 * Intelligent Batch Manager for Resume Processing
 * Optimizes batching to use 80% of Gemini's 1M token limit per request
 * Handles 15-20 resumes per batch with smart grouping
 */

class BatchManager {
  constructor(options = {}) {
    this.options = {
      maxTokensPerRequest: 800000, // 80% of 1M token limit for safety
      minBatchSize: 10,
      maxBatchSize: 25,
      targetBatchSize: 18,
      averageTokensPerResume: 350, // After optimization
      tokenBuffer: 50000, // Safety buffer for prompt and response
      similarityThreshold: 0.7,
      ...options
    };

    this.textOptimizer = new TextOptimizer({
      targetWordCount: 300, // ~300-400 tokens after conversion
      aggressiveMode: true
    });

    this.batchHistory = [];
    this.processingStats = {
      totalBatches: 0,
      totalResumes: 0,
      averageBatchSize: 0,
      averageTokenUsage: 0,
      tokenEfficiency: 0
    };
  }

  /**
   * Create optimized batches from resumes
   * @param {Array} resumes - Array of resume objects with text
   * @param {string} jobDescription - Job description for context
   * @returns {Promise<Array>} Array of optimized batches
   */
  async createBatches(resumes, jobDescription) {
    console.log(`Creating batches for ${resumes.length} resumes`);
    
    try {
      // Step 1: Optimize all resume texts
      const optimizedResumes = await this.optimizeResumes(resumes);
      
      // Step 2: Calculate token usage for job description
      const jobDescTokens = this.estimateTokens(jobDescription);
      const basePromptTokens = this.estimateBasePromptTokens();
      const fixedTokens = jobDescTokens + basePromptTokens + this.options.tokenBuffer;
      
      console.log(`Fixed tokens (job desc + prompt + buffer): ${fixedTokens}`);
      
      // Step 3: Group resumes by similarity if enabled
      const groupedResumes = this.groupSimilarResumes(optimizedResumes);
      
      // Step 4: Create optimal batches
      const batches = this.createOptimalBatches(groupedResumes, fixedTokens);
      
      // Step 5: Validate and adjust batches
      const validatedBatches = await this.validateBatches(batches, fixedTokens);
      
      console.log(`Created ${validatedBatches.length} batches with average size: ${(resumes.length / validatedBatches.length).toFixed(1)}`);
      
      // Update statistics
      this.updateStats(validatedBatches);
      
      return validatedBatches;
      
    } catch (error) {
      console.error('Error creating batches:', error);
      throw new Error(`Batch creation failed: ${error.message}`);
    }
  }

  /**
   * Optimize all resume texts for token efficiency
   * @param {Array} resumes - Array of resume objects
   * @returns {Promise<Array>} Array of optimized resume objects
   */
  async optimizeResumes(resumes) {
    console.log('Optimizing resumes for token efficiency...');
    
    const optimizedResumes = await Promise.all(
      resumes.map(async (resume, index) => {
        try {
          const optimization = this.textOptimizer.optimize(resume.text);
          
          return {
            ...resume,
            originalText: resume.text,
            text: optimization.optimizedText,
            optimization: {
              originalWordCount: optimization.originalWordCount,
              finalWordCount: optimization.finalWordCount,
              reductionPercentage: optimization.reductionPercentage,
              estimatedTokens: this.estimateTokens(optimization.optimizedText),
              quality: optimization.quality
            }
          };
        } catch (error) {
          console.error(`Error optimizing resume ${index + 1}:`, error);
          return {
            ...resume,
            optimization: {
              error: error.message,
              estimatedTokens: this.estimateTokens(resume.text)
            }
          };
        }
      })
    );

    const totalOriginalTokens = optimizedResumes.reduce((sum, r) => sum + this.estimateTokens(r.originalText || r.text), 0);
    const totalOptimizedTokens = optimizedResumes.reduce((sum, r) => sum + (r.optimization?.estimatedTokens || 0), 0);
    const tokenReduction = ((totalOriginalTokens - totalOptimizedTokens) / totalOriginalTokens * 100).toFixed(1);
    
    console.log(`Text optimization complete. Token reduction: ${tokenReduction}%`);
    
    return optimizedResumes;
  }

  /**
   * Group similar resumes for better batch context
   * @param {Array} resumes - Optimized resumes
   * @returns {Array} Grouped resumes
   */
  groupSimilarResumes(resumes) {
    if (resumes.length < 10) {
      // Too few resumes to benefit from grouping
      return [resumes];
    }

    console.log('Grouping similar resumes...');
    
    // Simple grouping by keyword similarity
    const groups = [];
    const used = new Set();
    
    for (let i = 0; i < resumes.length; i++) {
      if (used.has(i)) continue;
      
      const group = [resumes[i]];
      used.add(i);
      
      const baseKeywords = this.extractKeywords(resumes[i].text);
      
      for (let j = i + 1; j < resumes.length; j++) {
        if (used.has(j)) continue;
        
        const compareKeywords = this.extractKeywords(resumes[j].text);
        const similarity = this.calculateSimilarity(baseKeywords, compareKeywords);
        
        if (similarity >= this.options.similarityThreshold) {
          group.push(resumes[j]);
          used.add(j);
        }
      }
      
      groups.push(group);
    }
    
    console.log(`Created ${groups.length} similarity groups`);
    return groups;
  }

  /**
   * Create optimal batches considering token limits
   * @param {Array} groups - Grouped resumes
   * @param {number} fixedTokens - Fixed token overhead
   * @returns {Array} Optimal batches
   */
  createOptimalBatches(groups, fixedTokens) {
    const batches = [];
    const availableTokens = this.options.maxTokensPerRequest - fixedTokens;
    
    console.log(`Available tokens per batch: ${availableTokens}`);
    
    for (const group of groups) {
      let currentBatch = [];
      let currentTokens = 0;
      
      for (const resume of group) {
        const resumeTokens = resume.optimization?.estimatedTokens || this.estimateTokens(resume.text);
        
        // Check if adding this resume would exceed limits
        if (currentTokens + resumeTokens > availableTokens || 
            currentBatch.length >= this.options.maxBatchSize) {
          
          // Start new batch if current batch meets minimum size
          if (currentBatch.length >= this.options.minBatchSize) {
            batches.push({
              resumes: currentBatch,
              estimatedTokens: currentTokens,
              size: currentBatch.length
            });
            currentBatch = [];
            currentTokens = 0;
          }
        }
        
        currentBatch.push(resume);
        currentTokens += resumeTokens;
      }
      
      // Add remaining resumes to final batch
      if (currentBatch.length > 0) {
        if (currentBatch.length >= this.options.minBatchSize) {
          batches.push({
            resumes: currentBatch,
            estimatedTokens: currentTokens,
            size: currentBatch.length
          });
        } else if (batches.length > 0) {
          // Merge with last batch if too small
          const lastBatch = batches[batches.length - 1];
          lastBatch.resumes.push(...currentBatch);
          lastBatch.estimatedTokens += currentTokens;
          lastBatch.size = lastBatch.resumes.length;
        } else {
          // First batch, keep it even if small
          batches.push({
            resumes: currentBatch,
            estimatedTokens: currentTokens,
            size: currentBatch.length
          });
        }
      }
    }
    
    return batches;
  }

  /**
   * Validate and adjust batches for token limits
   * @param {Array} batches - Initial batches
   * @param {number} fixedTokens - Fixed token overhead
   * @returns {Promise<Array>} Validated batches
   */
  async validateBatches(batches, fixedTokens) {
    const validatedBatches = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const totalTokens = batch.estimatedTokens + fixedTokens;
      
      console.log(`Validating batch ${i + 1}: ${batch.size} resumes, ~${totalTokens} tokens`);
      
      if (totalTokens > this.options.maxTokensPerRequest) {
        console.warn(`Batch ${i + 1} exceeds token limit, splitting...`);
        
        // Split oversized batch
        const splitBatches = this.splitOversizedBatch(batch, fixedTokens);
        validatedBatches.push(...splitBatches);
      } else {
        // Add metadata
        batch.id = `batch_${Date.now()}_${i}`;
        batch.createdAt = new Date().toISOString();
        batch.tokenUtilization = (totalTokens / this.options.maxTokensPerRequest * 100).toFixed(1);
        
        validatedBatches.push(batch);
      }
    }
    
    return validatedBatches;
  }

  /**
   * Split an oversized batch into smaller batches
   * @param {Object} batch - Oversized batch
   * @param {number} fixedTokens - Fixed token overhead
   * @returns {Array} Split batches
   */
  splitOversizedBatch(batch, fixedTokens) {
    const splitBatches = [];
    const availableTokens = this.options.maxTokensPerRequest - fixedTokens;
    
    let currentBatch = [];
    let currentTokens = 0;
    
    for (const resume of batch.resumes) {
      const resumeTokens = resume.optimization?.estimatedTokens || this.estimateTokens(resume.text);
      
      if (currentTokens + resumeTokens > availableTokens && currentBatch.length > 0) {
        splitBatches.push({
          resumes: currentBatch,
          estimatedTokens: currentTokens,
          size: currentBatch.length,
          split: true
        });
        currentBatch = [];
        currentTokens = 0;
      }
      
      currentBatch.push(resume);
      currentTokens += resumeTokens;
    }
    
    if (currentBatch.length > 0) {
      splitBatches.push({
        resumes: currentBatch,
        estimatedTokens: currentTokens,
        size: currentBatch.length,
        split: true
      });
    }
    
    return splitBatches;
  }

  /**
   * Extract keywords from resume text
   * @param {string} text - Resume text
   * @returns {Set} Set of keywords
   */
  extractKeywords(text) {
    const keywords = new Set();
    
    // Common tech skills
    const techPatterns = [
      /\b(javascript|python|java|react|node\.?js|angular|vue|typescript|php|ruby|go|rust|swift|kotlin)\b/gi,
      /\b(aws|azure|gcp|docker|kubernetes|jenkins|git|github|gitlab)\b/gi,
      /\b(sql|mysql|postgresql|mongodb|redis|elasticsearch)\b/gi,
      /\b(machine learning|ai|data science|analytics|api|rest|graphql)\b/gi
    ];
    
    // Industry keywords
    const industryPatterns = [
      /\b(software|web|mobile|frontend|backend|fullstack|devops|qa|testing)\b/gi,
      /\b(finance|healthcare|education|marketing|sales|consulting)\b/gi,
      /\b(manager|lead|senior|junior|developer|engineer|analyst|designer)\b/gi
    ];
    
    const allPatterns = [...techPatterns, ...industryPatterns];
    
    for (const pattern of allPatterns) {
      const matches = text.match(pattern) || [];
      matches.forEach(match => keywords.add(match.toLowerCase()));
    }
    
    return keywords;
  }

  /**
   * Calculate similarity between two keyword sets
   * @param {Set} keywords1 - First set of keywords
   * @param {Set} keywords2 - Second set of keywords
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(keywords1, keywords2) {
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Estimate token count for text
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    if (!text) return 0;
    
    // Rough estimation: 1 token ≈ 0.75 words for English text
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / 0.75);
  }

  /**
   * Estimate base prompt tokens
   * @returns {number} Estimated base prompt tokens
   */
  estimateBasePromptTokens() {
    // Estimated tokens for the prompt template, instructions, etc.
    return 500;
  }

  /**
   * Update processing statistics
   * @param {Array} batches - Processed batches
   */
  updateStats(batches) {
    this.processingStats.totalBatches += batches.length;
    
    const totalResumes = batches.reduce((sum, batch) => sum + batch.size, 0);
    this.processingStats.totalResumes += totalResumes;
    
    this.processingStats.averageBatchSize = 
      this.processingStats.totalResumes / this.processingStats.totalBatches;
    
    const totalTokens = batches.reduce((sum, batch) => sum + batch.estimatedTokens, 0);
    this.processingStats.averageTokenUsage = totalTokens / batches.length;
    
    this.processingStats.tokenEfficiency = 
      (this.processingStats.averageTokenUsage / this.options.maxTokensPerRequest) * 100;
    
    // Store batch history
    this.batchHistory.push({
      timestamp: new Date().toISOString(),
      batchCount: batches.length,
      resumeCount: totalResumes,
      averageSize: totalResumes / batches.length,
      tokenUtilization: this.processingStats.tokenEfficiency
    });
    
    // Keep only last 100 batch operations
    if (this.batchHistory.length > 100) {
      this.batchHistory.splice(0, this.batchHistory.length - 100);
    }
  }

  /**
   * Get processing statistics
   * @returns {Object} Current statistics
   */
  getStats() {
    return {
      ...this.processingStats,
      batchHistory: this.batchHistory.slice(-10), // Last 10 operations
      configuration: {
        maxTokensPerRequest: this.options.maxTokensPerRequest,
        targetBatchSize: this.options.targetBatchSize,
        minBatchSize: this.options.minBatchSize,
        maxBatchSize: this.options.maxBatchSize
      }
    };
  }

  /**
   * Optimize batching configuration based on performance
   * @returns {Object} Optimization recommendations
   */
  optimizeConfiguration() {
    if (this.batchHistory.length < 5) {
      return { message: 'Not enough data for optimization' };
    }

    const recentHistory = this.batchHistory.slice(-10);
    const avgUtilization = recentHistory.reduce((sum, h) => sum + h.tokenUtilization, 0) / recentHistory.length;
    const avgBatchSize = recentHistory.reduce((sum, h) => sum + h.averageSize, 0) / recentHistory.length;

    const recommendations = [];

    if (avgUtilization < 60) {
      recommendations.push({
        type: 'increase_batch_size',
        current: this.options.targetBatchSize,
        recommended: Math.min(this.options.maxBatchSize, this.options.targetBatchSize + 3),
        reason: `Low token utilization (${avgUtilization.toFixed(1)}%)`
      });
    }

    if (avgUtilization > 85) {
      recommendations.push({
        type: 'decrease_batch_size',
        current: this.options.targetBatchSize,
        recommended: Math.max(this.options.minBatchSize, this.options.targetBatchSize - 2),
        reason: `High token utilization (${avgUtilization.toFixed(1)}%) - risk of exceeding limits`
      });
    }

    if (avgBatchSize < this.options.minBatchSize) {
      recommendations.push({
        type: 'reduce_token_overhead',
        reason: `Average batch size (${avgBatchSize.toFixed(1)}) below minimum`
      });
    }

    return {
      currentPerformance: {
        tokenUtilization: avgUtilization,
        averageBatchSize: avgBatchSize
      },
      recommendations
    };
  }

  /**
   * Generate batch processing report
   * @param {Array} batches - Processed batches
   * @returns {Object} Processing report
   */
  generateReport(batches) {
    const totalResumes = batches.reduce((sum, batch) => sum + batch.size, 0);
    const totalTokens = batches.reduce((sum, batch) => sum + batch.estimatedTokens, 0);
    const avgBatchSize = totalResumes / batches.length;
    const avgTokenUsage = totalTokens / batches.length;
    const tokenUtilization = (avgTokenUsage / this.options.maxTokensPerRequest) * 100;

    return {
      summary: {
        totalBatches: batches.length,
        totalResumes,
        averageBatchSize: avgBatchSize.toFixed(1),
        averageTokenUsage: Math.round(avgTokenUsage),
        tokenUtilization: tokenUtilization.toFixed(1) + '%'
      },
      batches: batches.map(batch => ({
        id: batch.id,
        size: batch.size,
        estimatedTokens: batch.estimatedTokens,
        tokenUtilization: batch.tokenUtilization + '%',
        split: batch.split || false
      })),
      optimization: this.optimizeConfiguration(),
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = BatchManager;
