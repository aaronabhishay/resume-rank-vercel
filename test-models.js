const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const modelsToTest = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-thinking-exp", 
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-pro",
  "gemini-pro-vision",
];

async function testModel(modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("❌ No API key found");
    return { model: modelName, status: "no_api_key" };
  }

  try {
    console.log(`\n🔍 Testing model: ${modelName}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent("Hello, this is a test.");
    const response = await result.response;
    const text = response.text();

    console.log(`✅ ${modelName} - WORKING`);
    console.log(`   Response: ${text.substring(0, 50)}...`);

    return { model: modelName, status: "working" };
  } catch (error) {
    console.log(`❌ ${modelName} - FAILED`);
    console.log(`   Error: ${error.message.substring(0, 100)}...`);
    return { model: modelName, status: "failed", error: error.message };
  }
}

async function testAllModels() {
  console.log("🚀 Testing Available Gemini Models\n");

  const results = [];
  for (const model of modelsToTest) {
    const result = await testModel(model);
    results.push(result);
    // Small delay to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n📊 SUMMARY:");
  console.log("===========");

  const workingModels = results.filter((r) => r.status === "working");
  const failedModels = results.filter((r) => r.status === "failed");

  console.log(`✅ Working Models (${workingModels.length}):`);
  workingModels.forEach((r) => console.log(`   • ${r.model}`));

  console.log(`\n❌ Failed Models (${failedModels.length}):`);
  failedModels.forEach((r) =>
    console.log(`   • ${r.model}: ${r.error?.substring(0, 50) || 'Unknown error'}...`)
  );

  console.log("\n💡 RECOMMENDATIONS:");
  console.log("==================");

  if (workingModels.length > 0) {
    console.log("• Use any of the working models above");
    console.log(
      "• gemini-2.0-flash-exp is currently your best option (200 requests/day free)"
    );
    console.log("• For higher limits, consider upgrading to paid tiers");
    console.log("• Update model-config.js with your preferred working model");
  } else {
    console.log("❌ No working models found. Check your API key and billing setup.");
  }

  return results;
}

if (require.main === module) {
  testAllModels().catch(console.error);
}

module.exports = { testAllModels, testModel };
