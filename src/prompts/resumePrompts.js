/**
 * Optimized Resume Analysis Prompts for Gemini 2.0 Flash
 * Token-efficient prompts designed for batch processing
 * Handles 15-20 resumes per request within 1M token limit
 */

class ResumePrompts {
  constructor() {
    // Base configurations for different processing modes
    this.configs = {
      batch: {
        maxResumes: 20,
        tokenBudget: 800000, // 80% of 1M limit
        responseFormat: 'structured_json'
      },
      single: {
        maxResumes: 1,
        tokenBudget: 100000,
        responseFormat: 'detailed_json'
      },
      quick: {
        maxResumes: 25,
        tokenBudget: 600000,
        responseFormat: 'compact_json'
      }
    };
  }

  /**
   * Generate batch processing prompt for multiple resumes
   * @param {Array} resumes - Array of resume texts
   * @param {string} jobDescription - Job description
   * @param {Object} options - Processing options
   * @returns {string} Optimized prompt
   */
  createBatchPrompt(resumes, jobDescription = '', options = {}) {
    const mode = options.mode || 'batch';
    const config = this.configs[mode];
    
    // Limit resumes to prevent token overflow
    const limitedResumes = resumes.slice(0, config.maxResumes);
    
    // Create resume sections with indexing
    const resumeSections = limitedResumes.map((resume, index) => 
      `[RESUME_${index + 1}]\n${this.optimizeResumeText(resume.text || resume)}\n[/RESUME_${index + 1}]`
    ).join('\n\n');

    const prompt = this.buildPrompt({
      type: 'batch',
      resumeCount: limitedResumes.length,
      jobDescription: this.optimizeJobDescription(jobDescription),
      resumeSections,
      responseFormat: config.responseFormat,
      ...options
    });

    return prompt;
  }

  /**
   * Generate single resume analysis prompt
   * @param {string} resumeText - Resume text
   * @param {string} jobDescription - Job description
   * @param {Object} options - Processing options
   * @returns {string} Optimized prompt
   */
  createSinglePrompt(resumeText, jobDescription = '', options = {}) {
    const prompt = this.buildPrompt({
      type: 'single',
      resumeCount: 1,
      jobDescription: this.optimizeJobDescription(jobDescription),
      resumeSections: `[RESUME]\n${this.optimizeResumeText(resumeText)}\n[/RESUME]`,
      responseFormat: 'detailed_json',
      ...options
    });

    return prompt;
  }

  /**
   * Generate quick screening prompt for high-volume processing
   * @param {Array} resumes - Array of resume texts
   * @param {Array} keywords - Key requirements to screen for
   * @param {Object} options - Processing options
   * @returns {string} Optimized screening prompt
   */
  createScreeningPrompt(resumes, keywords = [], options = {}) {
    const limitedResumes = resumes.slice(0, 25);
    
    const resumeSections = limitedResumes.map((resume, index) => 
      `[R${index + 1}]\n${this.optimizeResumeText(resume.text || resume, true)}\n[/R${index + 1}]`
    ).join('\n\n');

    return `TASK: Quick resume screening for ${limitedResumes.length} candidates

REQUIREMENTS: ${keywords.join(', ')}

RESUMES:
${resumeSections}

OUTPUT: JSON array with format:
[
  {"id": 1, "score": 85, "match": true, "key_skills": ["skill1", "skill2"], "reason": "brief explanation"},
  {"id": 2, "score": 45, "match": false, "key_skills": [], "reason": "brief explanation"}
]

Respond with JSON only. Score 0-100 based on requirement match.`;
  }

  /**
   * Build the complete prompt based on parameters
   * @param {Object} params - Prompt parameters
   * @returns {string} Complete prompt
   */
  buildPrompt(params) {
    const {
      type,
      resumeCount,
      jobDescription,
      resumeSections,
      responseFormat,
      extractFields = [],
      scoringWeights = {},
      includeAnalysis = true
    } = params;

    // Base instruction varies by type
    const baseInstruction = this.getBaseInstruction(type, resumeCount);
    
    // Job context (optional and optimized)
    const jobContext = jobDescription ? 
      `\nJOB CONTEXT:\n${jobDescription}\n` : 
      '\nEvaluating for general qualifications.\n';

    // Field extraction specification
    const fieldSpec = this.getFieldSpecification(responseFormat, extractFields);

    // Response format instruction
    const formatInstruction = this.getFormatInstruction(responseFormat, resumeCount);

    // Combine all parts
    return `${baseInstruction}${jobContext}
${resumeSections}

${fieldSpec}

${formatInstruction}`;
  }

  /**
   * Get base instruction for different prompt types
   * @param {string} type - Prompt type
   * @param {number} count - Number of resumes
   * @returns {string} Base instruction
   */
  getBaseInstruction(type, count) {
    switch (type) {
      case 'batch':
        return `Extract structured data from ${count} resumes efficiently.`;
      
      case 'single':
        return `Analyze this resume and extract comprehensive structured data.`;
      
      case 'screening':
        return `Screen ${count} resumes quickly for key requirements.`;
      
      default:
        return `Process ${count} resume(s) and extract key information.`;
    }
  }

  /**
   * Get field specification based on response format
   * @param {string} format - Response format
   * @param {Array} customFields - Custom fields to extract
   * @returns {string} Field specification
   */
  getFieldSpecification(format, customFields = []) {
    const baseFields = [
      'name', 'email', 'phone', 'location',
      'skills', 'experience', 'education'
    ];

    const fields = customFields.length > 0 ? customFields : baseFields;
    
    switch (format) {
      case 'structured_json':
        return `EXTRACT: ${fields.join(', ')}`;
      
      case 'detailed_json':
        return `EXTRACT ALL: ${fields.join(', ')}, projects, certifications, achievements`;
      
      case 'compact_json':
        return `EXTRACT KEY: name, email, top 5 skills, years experience`;
      
      default:
        return `EXTRACT: ${fields.join(', ')}`;
    }
  }

  /**
   * Get format instruction for response
   * @param {string} format - Response format
   * @param {number} count - Number of resumes
   * @returns {string} Format instruction
   */
  getFormatInstruction(format, count) {
    switch (format) {
      case 'structured_json':
        return this.getStructuredJSONFormat(count);
      
      case 'detailed_json':
        return this.getDetailedJSONFormat();
      
      case 'compact_json':
        return this.getCompactJSONFormat(count);
      
      default:
        return this.getStructuredJSONFormat(count);
    }
  }

  /**
   * Structured JSON format for batch processing
   * @param {number} count - Number of resumes
   * @returns {string} Format instruction
   */
  getStructuredJSONFormat(count) {
    const example = count > 1 ? 
      `{
  "resume_1": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-0123",
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": [
      {
        "title": "Software Engineer",
        "company": "Tech Corp",
        "duration": "2020-2023",
        "description": "Developed web applications"
      }
    ],
    "education": [
      {
        "degree": "BS Computer Science",
        "school": "University",
        "year": "2020"
      }
    ]
  },
  "resume_2": { ... }
}` :
      `{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": [...],
  "education": [...]
}`;

    return `OUTPUT FORMAT:
Return JSON only. No explanations.

Example:
${example}

Use "resume_X" keys for multiple resumes where X is the resume number.`;
  }

  /**
   * Detailed JSON format for comprehensive analysis
   * @returns {string} Format instruction
   */
  getDetailedJSONFormat() {
    return `OUTPUT FORMAT:
Comprehensive JSON with all available information.

{
  "personal": {
    "name": "full name",
    "email": "email address",
    "phone": "phone number",
    "location": "location",
    "linkedin": "linkedin URL",
    "github": "github URL"
  },
  "summary": "professional summary",
  "skills": {
    "technical": ["tech skills"],
    "soft": ["soft skills"],
    "languages": ["programming languages"],
    "tools": ["tools and technologies"]
  },
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "location": "job location",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or present",
      "description": "job description",
      "achievements": ["key achievements"]
    }
  ],
  "education": [
    {
      "degree": "degree type",
      "field": "field of study",
      "institution": "school name",
      "location": "school location",
      "graduationDate": "YYYY",
      "gpa": "GPA if available"
    }
  ],
  "projects": [...],
  "certifications": [...],
  "awards": [...]
}`;
  }

  /**
   * Compact JSON format for quick processing
   * @param {number} count - Number of resumes
   * @returns {string} Format instruction
   */
  getCompactJSONFormat(count) {
    const example = count > 1 ?
      `[
  {"id": 1, "name": "John Doe", "email": "john@example.com", "skills": ["JS", "React"], "years": 3},
  {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "skills": ["Python", "ML"], "years": 5}
]` :
      `{"name": "John Doe", "email": "john@example.com", "skills": ["JS", "React"], "years": 3}`;

    return `OUTPUT FORMAT:
Compact JSON with essential information only.

${example}

Include: name, email, top 5 skills, years of experience.`;
  }

  /**
   * Optimize resume text to reduce token usage
   * @param {string} text - Original resume text
   * @param {boolean} aggressive - Use aggressive optimization
   * @returns {string} Optimized text
   */
  optimizeResumeText(text, aggressive = false) {
    if (!text) return '';

    let optimized = text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove headers/footers
      .replace(/^page\s+\d+.*$/gmi, '')
      // Remove email signatures
      .replace(/best\s+regards,?\s*.*$/gmi, '')
      .replace(/sincerely,?\s*.*$/gmi, '')
      // Compress common phrases
      .replace(/responsible for/gi, 'led')
      .replace(/experience with/gi, 'used')
      .replace(/worked on/gi, 'did')
      .replace(/participated in/gi, 'joined')
      .trim();

    if (aggressive) {
      optimized = optimized
        // More aggressive compression
        .replace(/\b(very|really|quite|rather|extremely)\s+/gi, '')
        .replace(/\b(the|a|an)\s+/gi, '')
        .replace(/\band\s+/gi, ', ')
        .replace(/,\s*,/g, ',')
        // Limit to first 200 words for screening
        .split(/\s+/).slice(0, 200).join(' ');
    }

    return optimized;
  }

  /**
   * Optimize job description to reduce token usage
   * @param {string} jobDescription - Original job description
   * @returns {string} Optimized job description
   */
  optimizeJobDescription(jobDescription) {
    if (!jobDescription) return '';

    return jobDescription
      .replace(/\s+/g, ' ')
      .replace(/\b(we are looking for|we seek|ideal candidate)\s*/gi, '')
      .replace(/\b(requirements?|qualifications?):?\s*/gi, 'Need: ')
      .replace(/\b(responsibilities?|duties):?\s*/gi, 'Role: ')
      .trim()
      .substring(0, 500); // Limit job description length
  }

  /**
   * Create error handling prompt for failed API responses
   * @param {string} error - Error message
   * @param {Array} resumes - Original resumes
   * @returns {string} Simplified retry prompt
   */
  createRetryPrompt(error, resumes) {
    const simplified = resumes.slice(0, 5).map((resume, index) => 
      `[${index + 1}] ${this.optimizeResumeText(resume.text || resume, true)}`
    ).join('\n\n');

    return `Extract basic info from these resumes (name, email, skills only):

${simplified}

Return minimal JSON:
[
  {"name": "Name", "email": "email", "skills": ["skill1", "skill2"]},
  ...
]`;
  }

  /**
   * Estimate token count for a prompt
   * @param {string} prompt - Prompt text
   * @returns {number} Estimated token count
   */
  estimateTokens(prompt) {
    // Rough estimation: 1 token ≈ 0.75 words for English
    const wordCount = prompt.split(/\s+/).length;
    return Math.ceil(wordCount / 0.75);
  }

  /**
   * Validate prompt token count against limits
   * @param {string} prompt - Prompt to validate
   * @param {number} limit - Token limit
   * @returns {Object} Validation result
   */
  validatePrompt(prompt, limit = 800000) {
    const tokenCount = this.estimateTokens(prompt);
    
    return {
      isValid: tokenCount <= limit,
      tokenCount,
      limit,
      utilizationRate: (tokenCount / limit) * 100,
      recommendation: tokenCount > limit ? 'reduce_batch_size' : 'optimal'
    };
  }

  /**
   * Get prompt statistics and optimization suggestions
   * @returns {Object} Prompt statistics
   */
  getStats() {
    return {
      supportedFormats: Object.keys(this.configs),
      maxBatchSizes: {
        batch: this.configs.batch.maxResumes,
        single: this.configs.single.maxResumes,
        quick: this.configs.quick.maxResumes
      },
      tokenBudgets: {
        batch: this.configs.batch.tokenBudget,
        single: this.configs.single.tokenBudget,
        quick: this.configs.quick.tokenBudget
      },
      optimizations: [
        'Text compression',
        'Phrase replacement',
        'Whitespace removal',
        'Content truncation'
      ]
    };
  }
}

module.exports = ResumePrompts;
