#!/usr/bin/env node

// Test script for rate limiting with a very small batch
// This tests the new ultra-conservative settings to avoid 429 errors

const RateLimiter = require('./rate-limiter');
const BATCH_CONFIG = require('./batch-config');
const MODEL_CONFIG = require('./model-config');

console.log('🧪 Testing Ultra-Conservative Rate Limiting');
console.log('==========================================');

const rateLimiter = new RateLimiter({
  requestsPerMinute: BATCH_CONFIG.requestsPerMinute,
  requestsPerDay: BATCH_CONFIG.requestsPerDay,
  retryDelayMs: BATCH_CONFIG.retryDelayMs
});

async function testRateLimiting() {
  console.log('\n📊 Current Rate Limiter Status:');
  console.log(rateLimiter.getStatus());
  
  console.log('\n🔬 Testing 5 consecutive API calls with rate limiting...');
  
  const testCalls = 5;
  const startTime = Date.now();
  
  for (let i = 1; i <= testCalls; i++) {
    console.log(`\n--- Test Call ${i}/${testCalls} ---`);
    
    try {
      // This will automatically wait if needed
      await rateLimiter.enforceRateLimit();
      
      console.log(`✅ Call ${i} approved - simulating API request...`);
      
      // Simulate API processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`✅ Call ${i} completed successfully`);
      
    } catch (error) {
      console.error(`❌ Call ${i} failed:`, error.message);
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n⏱️  Total test time: ${totalTime / 1000} seconds`);
  console.log(`📊 Final rate limiter status:`);
  console.log(rateLimiter.getStatus());
  
  // Calculate expected time vs actual time
  const expectedMinTime = (testCalls - 1) * BATCH_CONFIG.delayMs;
  console.log(`\n📈 Analysis:`);
  console.log(`- Expected minimum time: ${expectedMinTime / 1000} seconds`);
  console.log(`- Actual time: ${totalTime / 1000} seconds`);
  console.log(`- Rate limiting working: ${totalTime >= expectedMinTime ? '✅ YES' : '❌ NO'}`);
  
  return totalTime >= expectedMinTime;
}

async function main() {
  try {
    console.log(`\n⚙️  Current Configuration:`);
    console.log(`- Model: ${MODEL_CONFIG.model}`);
    console.log(`- Batch size: ${BATCH_CONFIG.batchSize} resume(s) at a time`);
    console.log(`- Delay between batches: ${BATCH_CONFIG.delayMs}ms (${BATCH_CONFIG.delayMs / 1000}s)`);
    console.log(`- Requests per minute limit: ${BATCH_CONFIG.requestsPerMinute}`);
    console.log(`- Requests per day limit: ${BATCH_CONFIG.requestsPerDay}`);
    console.log(`- Retry delay: ${BATCH_CONFIG.retryDelayMs}ms (${BATCH_CONFIG.retryDelayMs / 1000}s)`);
    
    const passed = await testRateLimiting();
    
    if (passed) {
      console.log(`\n🎉 SUCCESS: Rate limiting is working correctly!`);
      console.log(`\n✅ Ready for production with 100 resumes:`);
      console.log(`- Processing 1 resume every 5 seconds`);
      console.log(`- Total time for 100 resumes: ~8.3 minutes`);
      console.log(`- Should avoid all 429 errors! 🎯`);
    } else {
      console.log(`\n⚠️  WARNING: Rate limiting may not be aggressive enough`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testRateLimiting };
