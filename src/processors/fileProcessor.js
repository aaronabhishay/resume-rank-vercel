const pdf = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');

/**
 * Enhanced File Processing Module
 * Handles PDF, DOC, DOCX, TXT files with error handling and validation
 * Supports fallback OCR for corrupted/scanned documents
 */

class FileProcessor {
  constructor(options = {}) {
    this.options = {
      minWordCount: 50, // Minimum words required for valid resume
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      supportedTypes: ['.pdf', '.doc', '.docx', '.txt'],
      ocrFallback: true,
      ...options
    };
  }

  /**
   * Main entry point for processing any file type
   * @param {Buffer|string} input - File buffer or file path
   * @param {string} filename - Original filename
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>} Processed text data with metadata
   */
  async processFile(input, filename, mimeType = null) {
    try {
      console.log(`Processing file: ${filename}`);
      
      // Validate file
      const validation = await this.validateFile(input, filename);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.error}`);
      }

      // Get file extension
      const ext = path.extname(filename).toLowerCase();
      
      // Process based on file type
      let result;
      switch (ext) {
        case '.pdf':
          result = await this.processPDF(input);
          break;
        case '.doc':
        case '.docx':
          result = await this.processWordDocument(input);
          break;
        case '.txt':
          result = await this.processTextFile(input);
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      // Validate extracted text
      const textValidation = this.validateExtractedText(result.text);
      if (!textValidation.isValid) {
        console.warn(`Low quality text extraction for ${filename}: ${textValidation.error}`);
        
        // Try OCR fallback for PDFs if enabled
        if (ext === '.pdf' && this.options.ocrFallback) {
          console.log(`Attempting OCR fallback for ${filename}`);
          result = await this.processWithOCR(input);
        }
      }

      return {
        text: result.text,
        wordCount: this.getWordCount(result.text),
        quality: textValidation.quality,
        processingTime: result.processingTime,
        method: result.method || 'text-extraction',
        metadata: {
          filename,
          fileSize: Buffer.isBuffer(input) ? input.length : 0,
          extension: ext,
          mimeType: mimeType,
          extractedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
      throw new Error(`Failed to process ${filename}: ${error.message}`);
    }
  }

  /**
   * Process PDF files using pdf-parse
   * @param {Buffer} buffer - PDF file buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async processPDF(buffer) {
    const startTime = Date.now();
    
    try {
      const data = await pdf(buffer, {
        // PDF parsing options
        pagerender: null, // Don't render pages for text extraction
        normalizeWhitespace: true,
        disableCombineTextItems: false
      });

      return {
        text: data.text,
        processingTime: Date.now() - startTime,
        method: 'pdf-parse',
        pages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Process Word documents (DOC/DOCX)
   * Note: This is a placeholder - you'll need to install mammoth.js or docx-parser
   * @param {Buffer} buffer - Document file buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async processWordDocument(buffer) {
    const startTime = Date.now();
    
    try {
      // For now, we'll implement a basic text extraction
      // In production, use mammoth.js for better extraction
      console.warn('Word document processing not fully implemented. Install mammoth.js for better support.');
      
      // Try to extract text as UTF-8 (basic fallback)
      const text = buffer.toString('utf-8').replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
      const cleanText = this.cleanExtractedText(text);
      
      return {
        text: cleanText,
        processingTime: Date.now() - startTime,
        method: 'basic-extraction',
        warning: 'Basic extraction used. Install mammoth.js for better Word document support.'
      };
    } catch (error) {
      throw new Error(`Word document processing failed: ${error.message}`);
    }
  }

  /**
   * Process plain text files
   * @param {Buffer} buffer - Text file buffer
   * @returns {Promise<Object>} Processed text and metadata
   */
  async processTextFile(buffer) {
    const startTime = Date.now();
    
    try {
      const text = buffer.toString('utf-8');
      const cleanText = this.cleanExtractedText(text);
      
      return {
        text: cleanText,
        processingTime: Date.now() - startTime,
        method: 'utf8-decode'
      };
    } catch (error) {
      throw new Error(`Text file processing failed: ${error.message}`);
    }
  }

  /**
   * OCR fallback for scanned documents
   * Note: This is a placeholder - you'll need to install tesseract.js
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<Object>} OCR extracted text
   */
  async processWithOCR(buffer) {
    const startTime = Date.now();
    
    console.warn('OCR processing not fully implemented. Install tesseract.js for OCR support.');
    
    // Placeholder implementation
    return {
      text: 'OCR extraction not available. Please install tesseract.js for OCR support.',
      processingTime: Date.now() - startTime,
      method: 'ocr-placeholder',
      warning: 'OCR not implemented'
    };
  }

  /**
   * Validate file before processing
   * @param {Buffer|string} input - File input
   * @param {string} filename - Filename
   * @returns {Object} Validation result
   */
  async validateFile(input, filename) {
    const ext = path.extname(filename).toLowerCase();
    
    // Check file extension
    if (!this.options.supportedTypes.includes(ext)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${ext}. Supported types: ${this.options.supportedTypes.join(', ')}`
      };
    }

    // Check file size
    const size = Buffer.isBuffer(input) ? input.length : 0;
    if (size > this.options.maxFileSize) {
      return {
        isValid: false,
        error: `File too large: ${(size / 1024 / 1024).toFixed(2)}MB. Max size: ${(this.options.maxFileSize / 1024 / 1024).toFixed(2)}MB`
      };
    }

    // Check if buffer is empty
    if (Buffer.isBuffer(input) && input.length === 0) {
      return {
        isValid: false,
        error: 'Empty file'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate extracted text quality
   * @param {string} text - Extracted text
   * @returns {Object} Validation result with quality score
   */
  validateExtractedText(text) {
    if (!text || typeof text !== 'string') {
      return {
        isValid: false,
        quality: 0,
        error: 'No text extracted'
      };
    }

    const wordCount = this.getWordCount(text);
    
    // Check minimum word count
    if (wordCount < this.options.minWordCount) {
      return {
        isValid: false,
        quality: 0.2,
        error: `Too few words: ${wordCount}. Minimum required: ${this.options.minWordCount}`
      };
    }

    // Calculate quality score based on various factors
    let quality = 0.5; // Base quality

    // Word count factor
    if (wordCount > 100) quality += 0.2;
    if (wordCount > 200) quality += 0.1;

    // Check for common resume keywords
    const resumeKeywords = [
      'experience', 'education', 'skills', 'work', 'job', 'position',
      'university', 'college', 'degree', 'certification', 'project',
      'responsibilities', 'achievements', 'contact', 'email', 'phone'
    ];
    
    const keywordMatches = resumeKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    
    quality += (keywordMatches / resumeKeywords.length) * 0.2;

    // Check for email pattern
    if (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
      quality += 0.1;
    }

    // Check for phone pattern
    if (text.match(/[\+]?[1-9]?[\-\.\s]?\(?[0-9]{3}\)?[\-\.\s]?[0-9]{3}[\-\.\s]?[0-9]{4}/)) {
      quality += 0.05;
    }

    quality = Math.min(quality, 1.0); // Cap at 1.0

    return {
      isValid: quality > 0.3,
      quality: quality,
      wordCount: wordCount,
      error: quality <= 0.3 ? 'Low quality text extraction' : null
    };
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanExtractedText(text) {
    if (!text) return '';

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers patterns
      .replace(/^page\s+\d+.*$/gmi, '')
      .replace(/^\d+\s*$/gm, '')
      // Remove excessive line breaks
      .replace(/\n\s*\n/g, '\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Count words in text
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  getWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get file processing statistics
   * @returns {Object} Processing statistics
   */
  getStats() {
    return {
      supportedTypes: this.options.supportedTypes,
      maxFileSize: this.options.maxFileSize,
      minWordCount: this.options.minWordCount,
      ocrEnabled: this.options.ocrFallback
    };
  }
}

module.exports = FileProcessor;
