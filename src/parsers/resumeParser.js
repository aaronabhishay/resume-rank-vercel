/**
 * Resume Parser for Structured JSON Extraction
 * Parses Gemini API responses and extracts structured resume data
 * Handles validation, cleaning, and standardization
 */

class ResumeParser {
  constructor(options = {}) {
    this.options = {
      strictMode: false,
      validateRequired: true,
      cleanData: true,
      standardizeFormats: true,
      confidenceThreshold: 0.7,
      ...options
    };

    // Required fields for resume validation
    this.requiredFields = ['name', 'email', 'skills', 'experience'];
    
    // Field validation patterns
    this.validationPatterns = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      phone: /^[\+]?[1-9]?[\-\.\s]?\(?[0-9]{3}\)?[\-\.\s]?[0-9]{3}[\-\.\s]?[0-9]{4,}$/,
      url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      date: /^\d{4}(-\d{2})?(-\d{2})?$/
    };

    // Skill categories for classification
    this.skillCategories = {
      programming: [
        'javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'go', 'rust',
        'swift', 'kotlin', 'php', 'ruby', 'scala', 'r', 'matlab', 'sql'
      ],
      frameworks: [
        'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask',
        'spring', 'laravel', 'rails', 'asp.net', 'bootstrap', 'tailwind'
      ],
      databases: [
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite',
        'oracle', 'cassandra', 'dynamodb', 'firebase'
      ],
      cloud: [
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
        'git', 'github', 'gitlab', 'bitbucket', 'heroku', 'vercel', 'netlify'
      ],
      tools: [
        'figma', 'sketch', 'photoshop', 'illustrator', 'jira', 'trello',
        'slack', 'notion', 'confluence', 'postman', 'insomnia'
      ]
    };

    // Processing statistics
    this.stats = {
      totalParsed: 0,
      successful: 0,
      failed: 0,
      averageConfidence: 0,
      commonErrors: new Map()
    };
  }

  /**
   * Parse Gemini API response to structured resume data
   * @param {string} response - Gemini API response
   * @param {Object} context - Additional context (original text, metadata)
   * @returns {Promise<Object>} Parsed resume data
   */
  async parseResponse(response, context = {}) {
    console.log('Parsing Gemini API response...');
    
    try {
      this.stats.totalParsed++;
      
      // Step 1: Extract JSON from response
      const jsonData = this.extractJSON(response);
      
      // Step 2: Validate structure
      const validation = this.validateStructure(jsonData);
      if (!validation.isValid && this.options.strictMode) {
        throw new Error(`Structure validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Step 3: Parse and clean data
      const parsedData = this.parseResumeData(jsonData, context);
      
      // Step 4: Validate extracted data
      const dataValidation = this.validateData(parsedData);
      if (!dataValidation.isValid && this.options.validateRequired) {
        console.warn(`Data validation warnings: ${dataValidation.errors.join(', ')}`);
      }
      
      // Step 5: Enhance with additional processing
      const enhancedData = await this.enhanceData(parsedData);
      
      // Step 6: Generate confidence scores
      const confidence = this.calculateConfidence(enhancedData, validation, dataValidation);
      
      this.stats.successful++;
      this.updateAverageConfidence(confidence.overall);
      
      const result = {
        ...enhancedData,
        metadata: {
          ...enhancedData.metadata,
          confidence,
          validation: {
            structure: validation,
            data: dataValidation
          },
          parsedAt: new Date().toISOString(),
          parserVersion: '1.0.0'
        }
      };

      console.log(`Resume parsed successfully. Confidence: ${confidence.overall.toFixed(2)}`);
      return result;
      
    } catch (error) {
      this.stats.failed++;
      this.recordError(error.message);
      
      console.error('Resume parsing failed:', error);
      throw new Error(`Resume parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract JSON data from Gemini response
   * @param {string} response - Raw response text
   * @returns {Object} Parsed JSON data
   */
  extractJSON(response) {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response format');
    }

    // Try to find JSON within the response
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to extract JSON between braces
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      // Try to fix common JSON issues
      const fixedJson = this.fixCommonJSONIssues(jsonStr);
      try {
        return JSON.parse(fixedJson);
      } catch (secondError) {
        throw new Error(`Invalid JSON format: ${error.message}`);
      }
    }
  }

  /**
   * Fix common JSON formatting issues
   * @param {string} jsonStr - JSON string with potential issues
   * @returns {string} Fixed JSON string
   */
  fixCommonJSONIssues(jsonStr) {
    return jsonStr
      // Fix trailing commas
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      // Fix unquoted keys
      .replace(/(\w+):/g, '"$1":')
      // Fix single quotes
      .replace(/'/g, '"')
      // Fix newlines in strings
      .replace(/"\s*\n\s*"/g, '" "');
  }

  /**
   * Validate JSON structure
   * @param {Object} data - Parsed JSON data
   * @returns {Object} Validation result
   */
  validateStructure(data) {
    const errors = [];
    const warnings = [];

    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return { isValid: false, errors, warnings };
    }

    // Check for required top-level fields
    const expectedFields = [
      'name', 'email', 'phone', 'skills', 'experience', 'education', 'summary'
    ];

    for (const field of this.requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check data types
    if (data.skills && !Array.isArray(data.skills)) {
      warnings.push('Skills should be an array');
    }

    if (data.experience && !Array.isArray(data.experience)) {
      warnings.push('Experience should be an array');
    }

    if (data.education && !Array.isArray(data.education)) {
      warnings.push('Education should be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completeness: (expectedFields.filter(field => data[field]).length / expectedFields.length)
    };
  }

  /**
   * Parse and clean resume data
   * @param {Object} rawData - Raw parsed data
   * @param {Object} context - Additional context
   * @returns {Object} Cleaned resume data
   */
  parseResumeData(rawData, context) {
    const cleaned = {
      // Personal Information
      name: this.cleanName(rawData.name),
      email: this.cleanEmail(rawData.email),
      phone: this.cleanPhone(rawData.phone),
      location: this.cleanLocation(rawData.location),
      linkedin: this.cleanURL(rawData.linkedin),
      github: this.cleanURL(rawData.github),
      portfolio: this.cleanURL(rawData.portfolio),
      
      // Professional Summary
      summary: this.cleanText(rawData.summary),
      objective: this.cleanText(rawData.objective),
      
      // Skills
      skills: this.parseSkills(rawData.skills),
      
      // Experience
      experience: this.parseExperience(rawData.experience),
      
      // Education
      education: this.parseEducation(rawData.education),
      
      // Projects
      projects: this.parseProjects(rawData.projects),
      
      // Certifications
      certifications: this.parseCertifications(rawData.certifications),
      
      // Additional Information
      languages: this.parseLanguages(rawData.languages),
      awards: this.parseAwards(rawData.awards),
      
      // Metadata
      metadata: {
        originalFileName: context.fileName,
        fileSize: context.fileSize,
        processingTime: context.processingTime,
        extractedFrom: 'gemini-api'
      }
    };

    return this.removeEmptyFields(cleaned);
  }

  /**
   * Parse skills section
   * @param {Array|string} skillsData - Skills data
   * @returns {Object} Categorized skills
   */
  parseSkills(skillsData) {
    if (!skillsData) return { technical: [], soft: [], other: [] };

    let skillsList = [];
    
    if (Array.isArray(skillsData)) {
      skillsList = skillsData.flat();
    } else if (typeof skillsData === 'string') {
      skillsList = skillsData.split(/[,;\n]/).map(s => s.trim());
    }

    // Clean and categorize skills
    const skills = {
      technical: [],
      soft: [],
      other: [],
      categories: {
        programming: [],
        frameworks: [],
        databases: [],
        cloud: [],
        tools: []
      }
    };

    for (const skill of skillsList) {
      if (!skill || skill.length < 2) continue;
      
      const cleanSkill = this.cleanSkill(skill);
      const category = this.categorizeSkill(cleanSkill);
      
      if (category === 'soft') {
        skills.soft.push(cleanSkill);
      } else if (category in skills.categories) {
        skills.categories[category].push(cleanSkill);
        skills.technical.push(cleanSkill);
      } else {
        skills.other.push(cleanSkill);
      }
    }

    return skills;
  }

  /**
   * Parse experience section
   * @param {Array} experienceData - Experience data
   * @returns {Array} Cleaned experience entries
   */
  parseExperience(experienceData) {
    if (!Array.isArray(experienceData)) return [];

    return experienceData.map(exp => ({
      title: this.cleanText(exp.title || exp.position || exp.role),
      company: this.cleanText(exp.company || exp.organization),
      location: this.cleanLocation(exp.location),
      startDate: this.parseDate(exp.startDate || exp.start),
      endDate: this.parseDate(exp.endDate || exp.end),
      current: exp.current || exp.endDate === 'present' || exp.end === 'present',
      description: this.cleanText(exp.description),
      responsibilities: this.parseArray(exp.responsibilities),
      achievements: this.parseArray(exp.achievements),
      technologies: this.parseArray(exp.technologies || exp.skills)
    })).filter(exp => exp.title || exp.company);
  }

  /**
   * Parse education section
   * @param {Array} educationData - Education data
   * @returns {Array} Cleaned education entries
   */
  parseEducation(educationData) {
    if (!Array.isArray(educationData)) return [];

    return educationData.map(edu => ({
      degree: this.cleanText(edu.degree || edu.qualification),
      field: this.cleanText(edu.field || edu.major || edu.subject),
      institution: this.cleanText(edu.institution || edu.school || edu.university),
      location: this.cleanLocation(edu.location),
      graduationDate: this.parseDate(edu.graduationDate || edu.graduation || edu.year),
      gpa: this.parseGPA(edu.gpa || edu.grade),
      honors: this.parseArray(edu.honors || edu.achievements)
    })).filter(edu => edu.degree || edu.institution);
  }

  /**
   * Parse projects section
   * @param {Array} projectsData - Projects data
   * @returns {Array} Cleaned project entries
   */
  parseProjects(projectsData) {
    if (!Array.isArray(projectsData)) return [];

    return projectsData.map(project => ({
      name: this.cleanText(project.name || project.title),
      description: this.cleanText(project.description),
      technologies: this.parseArray(project.technologies || project.tech),
      url: this.cleanURL(project.url || project.link || project.demo),
      github: this.cleanURL(project.github || project.repo),
      startDate: this.parseDate(project.startDate || project.start),
      endDate: this.parseDate(project.endDate || project.end)
    })).filter(project => project.name);
  }

  /**
   * Clean and validate individual data fields
   */
  cleanName(name) {
    if (!name) return null;
    return name.toString().trim().replace(/\s+/g, ' ');
  }

  cleanEmail(email) {
    if (!email) return null;
    const cleaned = email.toString().toLowerCase().trim();
    return this.validationPatterns.email.test(cleaned) ? cleaned : null;
  }

  cleanPhone(phone) {
    if (!phone) return null;
    const cleaned = phone.toString().replace(/[^\d\+\-\(\)\s]/g, '').trim();
    return this.validationPatterns.phone.test(cleaned) ? cleaned : null;
  }

  cleanURL(url) {
    if (!url) return null;
    const cleaned = url.toString().trim();
    if (!cleaned.startsWith('http')) {
      return `https://${cleaned}`;
    }
    return this.validationPatterns.url.test(cleaned) ? cleaned : null;
  }

  cleanLocation(location) {
    if (!location) return null;
    return location.toString().trim().replace(/\s+/g, ' ');
  }

  cleanText(text) {
    if (!text) return null;
    return text.toString().trim().replace(/\s+/g, ' ').replace(/\n+/g, ' ');
  }

  cleanSkill(skill) {
    return skill.toString().trim().toLowerCase()
      .replace(/[^\w\s\.\+\#]/g, '')
      .replace(/\s+/g, ' ');
  }

  parseDate(dateStr) {
    if (!dateStr) return null;
    
    const str = dateStr.toString().toLowerCase().trim();
    if (str === 'present' || str === 'current') {
      return 'present';
    }
    
    // Try various date formats
    const patterns = [
      /^(\d{4})$/,                          // YYYY
      /^(\d{4})-(\d{2})$/,                  // YYYY-MM
      /^(\d{4})-(\d{2})-(\d{2})$/,          // YYYY-MM-DD
      /^(\w+)\s+(\d{4})$/,                  // Month YYYY
      /^(\w+)\s+(\d{4})\s*-\s*(\w+)\s+(\d{4})$/ // Month YYYY - Month YYYY
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(str)) {
        return str;
      }
    }
    
    return null;
  }

  parseGPA(gpa) {
    if (!gpa) return null;
    
    const num = parseFloat(gpa.toString().replace(/[^\d\.]/g, ''));
    return (num >= 0 && num <= 4.0) ? num : null;
  }

  parseArray(data) {
    if (Array.isArray(data)) {
      return data.filter(item => item && item.toString().trim());
    }
    if (typeof data === 'string') {
      return data.split(/[,;\n]/).map(s => s.trim()).filter(s => s);
    }
    return [];
  }

  /**
   * Categorize skill based on type
   * @param {string} skill - Skill name
   * @returns {string} Skill category
   */
  categorizeSkill(skill) {
    const lowerSkill = skill.toLowerCase();
    
    for (const [category, skills] of Object.entries(this.skillCategories)) {
      if (skills.some(s => lowerSkill.includes(s) || s.includes(lowerSkill))) {
        return category;
      }
    }
    
    // Check for soft skills
    const softSkills = [
      'communication', 'leadership', 'teamwork', 'problem solving',
      'analytical', 'creative', 'organized', 'detail oriented'
    ];
    
    if (softSkills.some(s => lowerSkill.includes(s))) {
      return 'soft';
    }
    
    return 'other';
  }

  /**
   * Validate extracted data
   * @param {Object} data - Parsed data
   * @returns {Object} Validation result
   */
  validateData(data) {
    const errors = [];
    const warnings = [];

    // Email validation
    if (data.email && !this.validationPatterns.email.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation
    if (data.phone && !this.validationPatterns.phone.test(data.phone)) {
      warnings.push('Phone format may be invalid');
    }

    // Skills validation
    if (data.skills && data.skills.technical.length === 0 && data.skills.other.length === 0) {
      warnings.push('No skills extracted');
    }

    // Experience validation
    if (!data.experience || data.experience.length === 0) {
      warnings.push('No work experience found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateDataQualityScore(data)
    };
  }

  /**
   * Calculate data quality score
   * @param {Object} data - Parsed data
   * @returns {number} Quality score (0-1)
   */
  calculateDataQualityScore(data) {
    let score = 0;
    const checks = [
      { field: 'name', weight: 0.15, check: d => d.name },
      { field: 'email', weight: 0.15, check: d => d.email && this.validationPatterns.email.test(d.email) },
      { field: 'phone', weight: 0.1, check: d => d.phone },
      { field: 'skills', weight: 0.2, check: d => d.skills && (d.skills.technical.length + d.skills.other.length) > 3 },
      { field: 'experience', weight: 0.25, check: d => d.experience && d.experience.length > 0 },
      { field: 'education', weight: 0.15, check: d => d.education && d.education.length > 0 }
    ];

    for (const check of checks) {
      if (check.check(data)) {
        score += check.weight;
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Enhance data with additional processing
   * @param {Object} data - Basic parsed data
   * @returns {Promise<Object>} Enhanced data
   */
  async enhanceData(data) {
    const enhanced = { ...data };

    // Calculate experience metrics
    if (data.experience && data.experience.length > 0) {
      enhanced.experienceMetrics = this.calculateExperienceMetrics(data.experience);
    }

    // Extract key achievements
    enhanced.keyAchievements = this.extractKeyAchievements(data);

    // Skill proficiency estimation
    if (data.skills) {
      enhanced.skills.proficiencyEstimates = this.estimateSkillProficiency(data);
    }

    // Career progression analysis
    enhanced.careerProgression = this.analyzeCareerProgression(data.experience);

    return enhanced;
  }

  /**
   * Calculate experience metrics
   * @param {Array} experience - Experience data
   * @returns {Object} Experience metrics
   */
  calculateExperienceMetrics(experience) {
    let totalMonths = 0;
    const companies = new Set();
    const roles = new Set();

    for (const exp of experience) {
      companies.add(exp.company);
      roles.add(exp.title);
      
      // Calculate duration (simplified)
      if (exp.startDate && (exp.endDate || exp.current)) {
        const start = new Date(exp.startDate);
        const end = exp.current ? new Date() : new Date(exp.endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    }

    return {
      totalYears: (totalMonths / 12).toFixed(1),
      totalCompanies: companies.size,
      totalRoles: roles.size,
      averageJobDuration: totalMonths > 0 ? (totalMonths / experience.length / 12).toFixed(1) : 0
    };
  }

  /**
   * Extract key achievements from all sections
   * @param {Object} data - Resume data
   * @returns {Array} Key achievements
   */
  extractKeyAchievements(data) {
    const achievements = [];

    // From experience
    if (data.experience) {
      data.experience.forEach(exp => {
        if (exp.achievements) {
          achievements.push(...exp.achievements.map(a => ({ type: 'work', text: a, company: exp.company })));
        }
      });
    }

    // From education
    if (data.education) {
      data.education.forEach(edu => {
        if (edu.honors) {
          achievements.push(...edu.honors.map(h => ({ type: 'education', text: h, institution: edu.institution })));
        }
      });
    }

    // From projects
    if (data.projects) {
      achievements.push(...data.projects.map(p => ({ type: 'project', text: p.name, description: p.description })));
    }

    return achievements.slice(0, 10); // Limit to top 10
  }

  /**
   * Calculate confidence scores
   * @param {Object} data - Enhanced data
   * @param {Object} structureValidation - Structure validation result
   * @param {Object} dataValidation - Data validation result
   * @returns {Object} Confidence scores
   */
  calculateConfidence(data, structureValidation, dataValidation) {
    const scores = {
      structure: structureValidation.completeness || 0,
      dataQuality: dataValidation.score || 0,
      extraction: this.calculateExtractionConfidence(data),
      overall: 0
    };

    // Calculate overall confidence
    scores.overall = (scores.structure * 0.3 + scores.dataQuality * 0.4 + scores.extraction * 0.3);

    return scores;
  }

  /**
   * Calculate extraction confidence
   * @param {Object} data - Parsed data
   * @returns {number} Extraction confidence (0-1)
   */
  calculateExtractionConfidence(data) {
    let confidence = 0.5; // Base confidence

    // Boost confidence for well-structured data
    if (data.skills && data.skills.technical.length > 0) confidence += 0.15;
    if (data.experience && data.experience.length > 0) confidence += 0.15;
    if (data.education && data.education.length > 0) confidence += 0.1;
    if (data.email && this.validationPatterns.email.test(data.email)) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  /**
   * Remove empty fields from data
   * @param {Object} data - Data object
   * @returns {Object} Cleaned data
   */
  removeEmptyFields(data) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) cleaned[key] = value;
        } else if (typeof value === 'object') {
          const cleanedObj = this.removeEmptyFields(value);
          if (Object.keys(cleanedObj).length > 0) cleaned[key] = cleanedObj;
        } else {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }

  /**
   * Update average confidence statistic
   * @param {number} confidence - New confidence score
   */
  updateAverageConfidence(confidence) {
    const total = this.stats.successful;
    this.stats.averageConfidence = ((this.stats.averageConfidence * (total - 1)) + confidence) / total;
  }

  /**
   * Record parsing error for statistics
   * @param {string} error - Error message
   */
  recordError(error) {
    const count = this.stats.commonErrors.get(error) || 0;
    this.stats.commonErrors.set(error, count + 1);
  }

  /**
   * Get parser statistics
   * @returns {Object} Parser statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalParsed > 0 ? (this.stats.successful / this.stats.totalParsed) : 0,
      commonErrors: Array.from(this.stats.commonErrors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }))
    };
  }

  /**
   * Reset parser statistics
   */
  resetStats() {
    this.stats = {
      totalParsed: 0,
      successful: 0,
      failed: 0,
      averageConfidence: 0,
      commonErrors: new Map()
    };
  }
}

module.exports = ResumeParser;
