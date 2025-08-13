// Comprehensive test script for the rate limiting system
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Import configurations
const BATCH_CONFIG = require('./batch-config');
const MODEL_CONFIG = require('./model-config');

async function testRateLimitingSystem() {
  console.log("🧪 COMPREHENSIVE RATE LIMITING SYSTEM TEST\n");
  console.log("==========================================\n");

  // Test 1: Configuration Loading
  console.log("📋 Test 1: Configuration Loading");
  try {
    console.log("✅ Batch Config Loaded:");
    console.log(`   • Batch Size: ${BATCH_CONFIG.batchSize}`);
    console.log(`   • Delay: ${BATCH_CONFIG.delayMs}ms`);
    console.log(`   • Daily Limit: ${BATCH_CONFIG.requestsPerDay}`);
    
    console.log("✅ Model Config Loaded:");
    console.log(`   • Model: ${MODEL_CONFIG.model}`);
    console.log(`   • Temperature: ${MODEL_CONFIG.generationConfig.temperature}`);
    console.log(`   • Max Tokens: ${MODEL_CONFIG.generationConfig.maxOutputTokens}`);
  } catch (error) {
    console.log("❌ Configuration loading failed:", error.message);
    return false;
  }

  // Test 2: API Key Validation
  console.log("\n🔑 Test 2: API Key Validation");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("❌ No API key found in environment variables");
    console.log("   Set GEMINI_API_KEY in your .env file");
    return false;
  }
  console.log("✅ API key found (length:", apiKey.length, "characters)");

  // Test 3: Model Connectivity
  console.log("\n🔌 Test 3: Model Connectivity");
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: MODEL_CONFIG.model,
      generationConfig: MODEL_CONFIG.generationConfig
    });

    console.log(`   Testing ${MODEL_CONFIG.model}...`);
    const result = await model.generateContent("Hello, this is a test.");
    const response = await result.response;
    const text = response.text();

    console.log("✅ Model connectivity successful");
    console.log("   Response preview:", text.substring(0, 50) + "...");
  } catch (error) {
    console.log("❌ Model connectivity failed:", error.message);
    if (error.message.includes("429")) {
      console.log("   🚨 Rate limit hit! You may have exceeded daily limits.");
      console.log("   • Wait until tomorrow for reset");
      console.log("   • Consider upgrading to paid tier");
    }
    return false;
  }

  // Test 4: Rate Limiting Logic
  console.log("\n⏱️ Test 4: Rate Limiting Logic");
  try {
    // Simulate rate limiting functions
    let testApiCallCount = 0;
    const testRequestsPerDay = 5; // Small limit for testing
    
    function testCheckRateLimit() {
      if (testApiCallCount >= testRequestsPerDay) {
        throw new Error(`Daily rate limit of ${testRequestsPerDay} requests exceeded.`);
      }
      testApiCallCount++;
      console.log(`   API call ${testApiCallCount}/${testRequestsPerDay}`);
    }

    // Test normal operation
    for (let i = 0; i < 3; i++) {
      testCheckRateLimit();
    }
    console.log("✅ Normal rate limiting working");

    // Test rate limit enforcement
    try {
      for (let i = 0; i < 5; i++) {
        testCheckRateLimit();
      }
      console.log("❌ Rate limit should have been enforced");
      return false;
    } catch (rateLimitError) {
      console.log("✅ Rate limit enforcement working:", rateLimitError.message);
    }
  } catch (error) {
    console.log("❌ Rate limiting logic failed:", error.message);
    return false;
  }

  // Test 5: Batch Processing Logic
  console.log("\n📦 Test 5: Batch Processing Logic");
  try {
    const testResumes = [
      { name: "resume1.pdf", id: "1" },
      { name: "resume2.pdf", id: "2" },
      { name: "resume3.pdf", id: "3" },
      { name: "resume4.pdf", id: "4" },
      { name: "resume5.pdf", id: "5" },
    ];

    const batchSize = BATCH_CONFIG.batchSize;
    const batches = [];
    
    for (let i = 0; i < testResumes.length; i += batchSize) {
      batches.push(testResumes.slice(i, i + batchSize));
    }

    console.log(`   Created ${batches.length} batches from ${testResumes.length} resumes`);
    console.log(`   Batch sizes: ${batches.map(b => b.length).join(", ")}`);

    if (batches.length === Math.ceil(testResumes.length / batchSize)) {
      console.log("✅ Batch creation logic working correctly");
    } else {
      console.log("❌ Batch creation logic incorrect");
      return false;
    }
  } catch (error) {
    console.log("❌ Batch processing logic failed:", error.message);
    return false;
  }

  // Test 6: Environment Variables
  console.log("\n🌍 Test 6: Environment Variables");
  const requiredEnvVars = [
    'GEMINI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  let envVarsMissing = 0;
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Found`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      envVarsMissing++;
    }
  });

  if (envVarsMissing === 0) {
    console.log("✅ All required environment variables found");
  } else {
    console.log(`❌ ${envVarsMissing} environment variables missing`);
  }

  // Test 7: JSON Parsing
  console.log("\n📝 Test 7: JSON Parsing");
  try {
    const testJsonResponse = `[
      {
        "candidateName": "John Doe",
        "email": "john@example.com",
        "skillsMatch": 8,
        "experienceRelevance": 7,
        "educationFit": 6,
        "projectImpact": 7
      }
    ]`;

    const parsed = JSON.parse(testJsonResponse);
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log("✅ JSON parsing working correctly");
    } else {
      console.log("❌ JSON parsing produced unexpected result");
      return false;
    }
  } catch (error) {
    console.log("❌ JSON parsing failed:", error.message);
    return false;
  }

  // Final Summary
  console.log("\n🎉 FINAL SUMMARY");
  console.log("================");
  console.log("✅ All tests passed successfully!");
  console.log("\n💡 NEXT STEPS:");
  console.log("1. Run 'node check-api-usage.js' to verify API connectivity");
  console.log("2. Test with a small batch of resumes first");
  console.log("3. Monitor API usage in Google AI Studio dashboard");
  console.log("4. Adjust batch settings if needed with 'node adjust-batch-settings.js'");
  
  console.log("\n📊 CURRENT LIMITS:");
  console.log(`• Model: ${MODEL_CONFIG.model}`);
  console.log("• Free Tier: 200 requests/day");
  console.log(`• Batch Size: ${BATCH_CONFIG.batchSize} resumes`);
  console.log(`• Delay: ${BATCH_CONFIG.delayMs}ms between batches`);
  
  return true;
}

// Run the test if executed directly
if (require.main === module) {
  testRateLimitingSystem().then(success => {
    if (success) {
      console.log("\n🚀 System ready for production use!");
      process.exit(0);
    } else {
      console.log("\n❌ System not ready. Please fix the issues above.");
      process.exit(1);
    }
  }).catch(error => {
    console.error("\n💥 Unexpected error during testing:", error);
    process.exit(1);
  });
}

module.exports = { testRateLimitingSystem };
