// Advanced Rate Limiter for Gemini API
// Strictly enforces both RPM (requests per minute) and RPD (requests per day) limits

class RateLimiter {
  constructor(config = {}) {
    this.requestsPerMinute = config.requestsPerMinute || 12;
    this.requestsPerDay = config.requestsPerDay || 180;
    this.retryDelayMs = config.retryDelayMs || 60000;
    
    // Track requests in current minute
    this.minuteRequests = [];
    
    // Track requests in current day
    this.dayRequests = 0;
    this.lastResetDate = new Date().toDateString();
    
    console.log(`🔒 Rate Limiter initialized: ${this.requestsPerMinute} RPM, ${this.requestsPerDay} RPD`);
  }
  
  // Reset daily counter if new day
  resetDailyCounterIfNeeded() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dayRequests = 0;
      this.lastResetDate = today;
      console.log(`📅 Daily rate limit counter reset for ${today}`);
    }
  }
  
  // Clean up old minute requests
  cleanupMinuteRequests() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.minuteRequests = this.minuteRequests.filter(time => time > oneMinuteAgo);
  }
  
  // Check if we can make a request now
  canMakeRequest() {
    this.resetDailyCounterIfNeeded();
    this.cleanupMinuteRequests();
    
    // Check daily limit
    if (this.dayRequests >= this.requestsPerDay) {
      throw new Error(`Daily rate limit of ${this.requestsPerDay} requests exceeded. Please wait until tomorrow or upgrade your plan.`);
    }
    
    // Check minute limit
    if (this.minuteRequests.length >= this.requestsPerMinute) {
      const oldestRequest = Math.min(...this.minuteRequests);
      const timeToWait = 60000 - (Date.now() - oldestRequest);
      return { canProceed: false, waitTime: Math.max(1000, timeToWait) };
    }
    
    return { canProceed: true, waitTime: 0 };
  }
  
  // Record a successful request
  recordRequest() {
    const now = Date.now();
    this.minuteRequests.push(now);
    this.dayRequests++;
    
    console.log(`📊 API call ${this.dayRequests}/${this.requestsPerDay} today, ${this.minuteRequests.length}/${this.requestsPerMinute} this minute`);
  }
  
  // Calculate required delay to stay under RPM limit
  getRequiredDelay() {
    this.cleanupMinuteRequests();
    
    if (this.minuteRequests.length === 0) {
      return 0; // First request in the minute
    }
    
    // Calculate time since last request
    const lastRequest = Math.max(...this.minuteRequests);
    const timeSinceLastRequest = Date.now() - lastRequest;
    
    // We want to spread requests evenly across the minute
    // With 12 RPM, that's one request every 5 seconds (60/12 = 5)
    const minDelayBetweenRequests = Math.ceil(60000 / this.requestsPerMinute);
    
    const requiredDelay = Math.max(0, minDelayBetweenRequests - timeSinceLastRequest);
    
    return requiredDelay;
  }
  
  // Wait until we can make a request
  async waitForRateLimit() {
    const check = this.canMakeRequest();
    if (!check.canProceed) {
      console.log(`⏳ Minute rate limit reached. Waiting ${check.waitTime / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, check.waitTime));
      return this.waitForRateLimit(); // Recursive check
    }
    
    // Even if we can make a request, we might need to delay to maintain proper spacing
    const requiredDelay = this.getRequiredDelay();
    if (requiredDelay > 0) {
      console.log(`⏳ Enforcing ${requiredDelay / 1000}s delay to maintain ${this.requestsPerMinute} RPM limit...`);
      await new Promise(resolve => setTimeout(resolve, requiredDelay));
    }
  }
  
  // Main method to call before making API request
  async enforceRateLimit() {
    await this.waitForRateLimit();
    this.recordRequest();
  }
  
  // Get current status
  getStatus() {
    this.resetDailyCounterIfNeeded();
    this.cleanupMinuteRequests();
    
    return {
      dailyUsage: `${this.dayRequests}/${this.requestsPerDay}`,
      minuteUsage: `${this.minuteRequests.length}/${this.requestsPerMinute}`,
      canMakeRequest: this.canMakeRequest().canProceed
    };
  }
}

module.exports = RateLimiter;
