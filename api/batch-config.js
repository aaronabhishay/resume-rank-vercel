// Configuration for batch processing resumes
// Modify these values to adjust processing behavior

module.exports = {
  // Batch processing settings
  batchSize: 2, // Number of resumes to process simultaneously (1-3 recommended)
  delayMs: 3000, // Delay between batches in milliseconds (2000-5000 recommended)

  // Retry settings
  maxRetries: 3, // Maximum retries for failed requests
  retryDelayMs: 10000, // Wait time before retrying after rate limit (in milliseconds)

  // Rate limit settings
  requestsPerMinute: 10, // Conservative limit to avoid hitting API limits
  requestsPerDay: 180, // Conservative daily limit for Gemini 2.0 Flash (200 total, leaving buffer)

  // Logging
  verbose: true, // Enable detailed logging
  showProgress: true, // Show progress indicators

  // Error handling
  continueOnError: true, // Continue processing other resumes if one fails
  savePartialResults: true, // Save results even if some resumes fail
};