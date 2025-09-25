// Configuration for batch processing resumes
// Modify these values to adjust processing behavior

module.exports = {
  // Batch processing settings - OPTIMIZED for stability and efficiency
  batchSize: 3, // Process THREE resumes per API call (safer for API stability)
  delayMs: 5000, // 5 second delay between each batch (12 per minute max = under 15 RPM limit)

  // Retry settings
  maxRetries: 3, // Maximum retries for failed requests
  retryDelayMs: 60000, // Wait 60 seconds before retrying after rate limit (in milliseconds)

  // Rate limit settings - MATCH GEMINI 2.0 FLASH FREE TIER EXACTLY
  requestsPerMinute: 12, // Ultra conservative - under 15 RPM limit
  requestsPerDay: 180, // Conservative daily limit for Gemini 2.0 Flash (200 total, leaving buffer)

  // Logging
  verbose: true, // Enable detailed logging
  showProgress: true, // Show progress indicators

  // Error handling
  continueOnError: true, // Continue processing other resumes if one fails
  savePartialResults: true, // Save results even if some resumes fail
};
