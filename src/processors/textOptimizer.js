/**
 * Text Optimization Module
 * Optimizes resume text to reduce token usage while preserving key information
 * Target: Reduce 500 words to 300-350 words (30-40% reduction)
 */

class TextOptimizer {
  constructor(options = {}) {
    this.options = {
      targetWordCount: 350,
      minWordCount: 250,
      maxWordCount: 400,
      preserveStructure: true,
      aggressiveMode: false,
      ...options
    };

    // Common phrases to compress
    this.phraseReplacements = {
      // Responsibility phrases
      'responsible for': 'led',
      'was responsible for': 'led',
      'responsibilities included': 'duties:',
      'duties and responsibilities': 'duties:',
      'key responsibilities': 'duties:',
      'primary responsibilities': 'duties:',
      
      // Experience phrases
      'experience with': 'used',
      'experienced in': 'skilled in',
      'hands-on experience': 'experience',
      'extensive experience': 'experience',
      'professional experience': 'experience',
      'working experience': 'experience',
      
      // Achievement phrases
      'successfully completed': 'completed',
      'successfully implemented': 'implemented',
      'successfully delivered': 'delivered',
      'achieved success in': 'achieved',
      
      // Common connectors
      'in order to': 'to',
      'with the goal of': 'to',
      'for the purpose of': 'to',
      'with the objective of': 'to',
      
      // Time references
      'during the period of': 'during',
      'throughout the duration of': 'during',
      'over the course of': 'during',
      
      // Technical phrases
      'technologies such as': 'technologies:',
      'programming languages including': 'languages:',
      'tools and technologies': 'tools:',
      'software applications': 'software:',
      'frameworks and libraries': 'frameworks:'
    };

    // Filler words to remove
    this.fillerWords = [
      'very', 'really', 'quite', 'rather', 'somewhat', 'fairly',
      'pretty', 'basically', 'essentially', 'generally', 'typically',
      'usually', 'normally', 'commonly', 'frequently', 'often',
      'various', 'different', 'multiple', 'several', 'numerous',
      'appropriate', 'relevant', 'suitable', 'effective', 'efficient',
      'successful', 'significant', 'important', 'valuable', 'useful'
    ];

    // Section patterns for structure preservation
    this.sectionPatterns = {
      contact: /contact|email|phone|address|linkedin/i,
      objective: /objective|summary|profile|overview/i,
      experience: /experience|employment|work|career|position|job/i,
      education: /education|academic|degree|university|college|school/i,
      skills: /skills|technical|competencies|expertise|proficiencies/i,
      projects: /projects|portfolio|achievements|accomplishments/i,
      certifications: /certifications|certificates|licenses|credentials/i
    };
  }

  /**
   * Main optimization function
   * @param {string} text - Original resume text
   * @param {Object} options - Optimization options
   * @returns {Object} Optimized text with metadata
   */
  optimize(text, options = {}) {
    const startTime = Date.now();
    const opts = { ...this.options, ...options };
    
    console.log(`Starting text optimization. Original length: ${this.getWordCount(text)} words`);

    try {
      let optimizedText = text;
      const steps = [];

      // Step 1: Basic cleaning
      optimizedText = this.basicClean(optimizedText);
      steps.push({ step: 'basic_clean', wordCount: this.getWordCount(optimizedText) });

      // Step 2: Remove excessive formatting
      optimizedText = this.removeFormatting(optimizedText);
      steps.push({ step: 'remove_formatting', wordCount: this.getWordCount(optimizedText) });

      // Step 3: Compress common phrases
      optimizedText = this.compressPhrases(optimizedText);
      steps.push({ step: 'compress_phrases', wordCount: this.getWordCount(optimizedText) });

      // Step 4: Remove filler words
      optimizedText = this.removeFillerWords(optimizedText);
      steps.push({ step: 'remove_fillers', wordCount: this.getWordCount(optimizedText) });

      // Step 5: Standardize formats
      optimizedText = this.standardizeFormats(optimizedText);
      steps.push({ step: 'standardize', wordCount: this.getWordCount(optimizedText) });

      // Step 6: Extract key sections
      const sections = this.extractSections(optimizedText);
      steps.push({ step: 'extract_sections', sectionCount: Object.keys(sections).length });

      // Step 7: Aggressive optimization if needed
      if (this.getWordCount(optimizedText) > opts.targetWordCount && opts.aggressiveMode) {
        optimizedText = this.aggressiveOptimize(optimizedText, sections);
        steps.push({ step: 'aggressive_optimize', wordCount: this.getWordCount(optimizedText) });
      }

      // Step 8: Final structure and cleanup
      optimizedText = this.finalCleanup(optimizedText);
      steps.push({ step: 'final_cleanup', wordCount: this.getWordCount(optimizedText) });

      const finalWordCount = this.getWordCount(optimizedText);
      const originalWordCount = this.getWordCount(text);
      const reductionPercentage = ((originalWordCount - finalWordCount) / originalWordCount * 100).toFixed(1);

      return {
        optimizedText,
        originalWordCount,
        finalWordCount,
        reductionPercentage: parseFloat(reductionPercentage),
        processingTime: Date.now() - startTime,
        sections,
        steps,
        quality: this.assessQuality(optimizedText, sections),
        metadata: {
          targetReached: finalWordCount <= opts.targetWordCount,
          optimizationLevel: opts.aggressiveMode ? 'aggressive' : 'standard',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Text optimization error:', error);
      throw new Error(`Text optimization failed: ${error.message}`);
    }
  }

  /**
   * Basic text cleaning
   * @param {string} text - Input text
   * @returns {string} Cleaned text
   */
  basicClean(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page headers/footers
      .replace(/^page\s+\d+.*$/gmi, '')
      .replace(/^\d+\s*$/gm, '')
      // Remove email signatures
      .replace(/best\s+regards,?\s*/gi, '')
      .replace(/sincerely,?\s*/gi, '')
      .replace(/thank\s+you,?\s*/gi, '')
      // Remove excessive punctuation
      .replace(/\.{2,}/g, '.')
      .replace(/,{2,}/g, ',')
      // Trim
      .trim();
  }

  /**
   * Remove formatting artifacts
   * @param {string} text - Input text
   * @returns {string} Cleaned text
   */
  removeFormatting(text) {
    return text
      // Remove bullet points and dashes
      .replace(/^[\s]*[•\-\*\+]\s*/gm, '')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove extra spaces before punctuation
      .replace(/\s+([,.;:!?])/g, '$1')
      // Remove trailing spaces
      .replace(/[ \t]+$/gm, '');
  }

  /**
   * Compress common phrases
   * @param {string} text - Input text
   * @returns {string} Compressed text
   */
  compressPhrases(text) {
    let compressed = text;
    
    for (const [phrase, replacement] of Object.entries(this.phraseReplacements)) {
      const regex = new RegExp(phrase, 'gi');
      compressed = compressed.replace(regex, replacement);
    }

    return compressed;
  }

  /**
   * Remove filler words
   * @param {string} text - Input text
   * @returns {string} Text without fillers
   */
  removeFillerWords(text) {
    const words = text.split(/\s+/);
    const filtered = words.filter(word => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      return !this.fillerWords.includes(cleanWord) || cleanWord.length <= 2;
    });
    
    return filtered.join(' ');
  }

  /**
   * Standardize date and format patterns
   * @param {string} text - Input text
   * @returns {string} Standardized text
   */
  standardizeFormats(text) {
    return text
      // Standardize date formats
      .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, '$3-$1-$2')
      .replace(/\b(\w+)\s+(\d{4})\s*-\s*(\w+)\s+(\d{4})\b/gi, '$1 $2 - $3 $4')
      // Standardize GPA format
      .replace(/gpa:?\s*(\d+\.?\d*)/gi, 'GPA $1')
      // Standardize company/position format
      .replace(/\|\s*/g, ' | ')
      // Remove redundant text
      .replace(/resume\s+of\s+/gi, '')
      .replace /curriculum\s+vitae/gi, '');
  }

  /**
   * Extract key sections from resume
   * @param {string} text - Input text
   * @returns {Object} Extracted sections
   */
  extractSections(text) {
    const sections = {};
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    let currentSection = 'general';
    let sectionContent = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line is a section header
      let matchedSection = null;
      for (const [sectionName, pattern] of Object.entries(this.sectionPatterns)) {
        if (pattern.test(trimmedLine) && trimmedLine.length < 50) {
          matchedSection = sectionName;
          break;
        }
      }

      if (matchedSection) {
        // Save previous section
        if (sectionContent.length > 0) {
          sections[currentSection] = sectionContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = matchedSection;
        sectionContent = [];
      } else {
        sectionContent.push(trimmedLine);
      }
    }

    // Save last section
    if (sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Aggressive optimization for severely over-sized text
   * @param {string} text - Input text
   * @param {Object} sections - Extracted sections
   * @returns {string} Aggressively optimized text
   */
  aggressiveOptimize(text, sections) {
    console.log('Applying aggressive optimization');
    
    // Priority order for sections
    const sectionPriority = ['contact', 'skills', 'experience', 'education', 'projects', 'certifications', 'objective'];
    
    let optimized = '';
    let currentWordCount = 0;
    const maxWords = this.options.targetWordCount;

    for (const sectionName of sectionPriority) {
      if (sections[sectionName] && currentWordCount < maxWords) {
        let sectionText = sections[sectionName];
        
        // Compress section further
        sectionText = this.compressSection(sectionText, sectionName);
        
        const sectionWords = this.getWordCount(sectionText);
        if (currentWordCount + sectionWords <= maxWords) {
          optimized += (optimized ? '\n\n' : '') + sectionText;
          currentWordCount += sectionWords;
        } else {
          // Truncate section to fit
          const remainingWords = maxWords - currentWordCount;
          const truncated = this.truncateToWordCount(sectionText, remainingWords);
          if (truncated.trim()) {
            optimized += (optimized ? '\n\n' : '') + truncated;
          }
          break;
        }
      }
    }

    return optimized;
  }

  /**
   * Compress individual sections
   * @param {string} text - Section text
   * @param {string} sectionName - Section type
   * @returns {string} Compressed section
   */
  compressSection(text, sectionName) {
    switch (sectionName) {
      case 'experience':
        return this.compressExperience(text);
      case 'education':
        return this.compressEducation(text);
      case 'skills':
        return this.compressSkills(text);
      case 'projects':
        return this.compressProjects(text);
      default:
        return text;
    }
  }

  /**
   * Compress experience section
   * @param {string} text - Experience text
   * @returns {string} Compressed experience
   */
  compressExperience(text) {
    return text
      .replace(/job\s+title:?\s*/gi, '')
      .replace /company:?\s*/gi, '')
      .replace(/duration:?\s*/gi, '')
      .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi, (match) => match.substring(0, 3))
      .replace(/\b(\d{4})\s*-\s*present\b/gi, '$1-now')
      .replace(/\b(\d{4})\s*-\s*(\d{4})\b/gi, '$1-$2');
  }

  /**
   * Compress education section
   * @param {string} text - Education text
   * @returns {string} Compressed education
   */
  compressEducation(text) {
    return text
      .replace(/bachelor\s+of\s+science/gi, 'BS')
      .replace(/bachelor\s+of\s+arts/gi, 'BA')
      .replace(/master\s+of\s+science/gi, 'MS')
      .replace(/master\s+of\s+arts/gi, 'MA')
      .replace(/master\s+of\s+business\s+administration/gi, 'MBA')
      .replace(/university/gi, 'Univ')
      .replace(/college/gi, 'Coll')
      .replace(/graduated/gi, 'grad');
  }

  /**
   * Compress skills section
   * @param {string} text - Skills text
   * @returns {string} Compressed skills
   */
  compressSkills(text) {
    return text
      .replace(/programming\s+languages?:?\s*/gi, 'Languages: ')
      .replace(/technologies?:?\s*/gi, 'Tech: ')
      .replace(/frameworks?:?\s*/gi, 'Frameworks: ')
      .replace(/databases?:?\s*/gi, 'DB: ')
      .replace(/\s+and\s+/gi, ', ')
      .replace(/,\s*,/g, ',');
  }

  /**
   * Compress projects section
   * @param {string} text - Projects text
   * @returns {string} Compressed projects
   */
  compressProjects(text) {
    return text
      .replace(/project\s+title:?\s*/gi, '')
      .replace(/description:?\s*/gi, '')
      .replace(/technologies\s+used:?\s*/gi, 'Tech: ')
      .replace(/github:?\s*/gi, 'Code: ');
  }

  /**
   * Final cleanup and structure
   * @param {string} text - Input text
   * @returns {string} Final cleaned text
   */
  finalCleanup(text) {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2');
  }

  /**
   * Truncate text to specific word count
   * @param {string} text - Input text
   * @param {number} maxWords - Maximum word count
   * @returns {string} Truncated text
   */
  truncateToWordCount(text, maxWords) {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    
    return words.slice(0, maxWords).join(' ') + '...';
  }

  /**
   * Assess optimization quality
   * @param {string} text - Optimized text
   * @param {Object} sections - Extracted sections
   * @returns {Object} Quality assessment
   */
  assessQuality(text, sections) {
    const wordCount = this.getWordCount(text);
    let score = 0.5; // Base score

    // Word count score
    if (wordCount >= this.options.minWordCount && wordCount <= this.options.maxWordCount) {
      score += 0.2;
    }

    // Section coverage score
    const essentialSections = ['experience', 'skills', 'education'];
    const foundSections = essentialSections.filter(section => sections[section]);
    score += (foundSections.length / essentialSections.length) * 0.2;

    // Content preservation score
    const resumeKeywords = ['experience', 'skills', 'education', 'work', 'project'];
    const keywordCount = resumeKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    score += (keywordCount / resumeKeywords.length) * 0.1;

    return {
      score: Math.min(score, 1.0),
      wordCount,
      sectionsFound: Object.keys(sections).length,
      withinTargetRange: wordCount >= this.options.minWordCount && wordCount <= this.options.maxWordCount
    };
  }

  /**
   * Get word count
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  getWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get optimization statistics
   * @returns {Object} Optimizer statistics
   */
  getStats() {
    return {
      targetWordCount: this.options.targetWordCount,
      minWordCount: this.options.minWordCount,
      maxWordCount: this.options.maxWordCount,
      phraseReplacements: Object.keys(this.phraseReplacements).length,
      fillerWords: this.fillerWords.length,
      supportedSections: Object.keys(this.sectionPatterns)
    };
  }
}

module.exports = TextOptimizer;
