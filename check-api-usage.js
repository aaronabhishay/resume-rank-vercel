const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const MODEL_CONFIG = require("./model-config");

async function checkApiUsage() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("❌ No API key found");
    console.log("Please set GEMINI_API_KEY in your .env file");
    return;
  }

  console.log("🔍 Checking Gemini API status...");
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.model });
    console.log("📡 Sending test request...");
    const result = await model.generateContent(
      "Hello, this is a test request."
    );
    const response = await result.response;
    const text = response.text();
    console.log("✅ API is working!");
    console.log("📝 Test response:", text.substring(0, 50) + "...");
    console.log("\n📊 Rate Limit Information:");
    console.log("• Free tier: 200 requests per day (Gemini 2.0 Flash)");
    console.log("• Tier 1: 10,000 requests per day");
    console.log("• Tier 2: 100,000 requests per day");
    console.log("• Tier 3: 5,000,000,000 requests per day");
    console.log(
      "• Current status: Working (4x higher limits than Gemini 1.5 Flash)"
    );
    console.log("\n💡 Tips to avoid rate limits:");
    console.log("• Process resumes in smaller batches (2-3 at a time)");
    console.log("• Add delays between batches (3-5 seconds)");
    console.log("• Consider upgrading to paid plan for higher limits");
    console.log("• Monitor your usage in Google AI Studio dashboard");
  } catch (error) {
    console.log("❌ API Error:", error.message);
    if (error.message.includes("429")) {
      console.log("\n🚨 RATE LIMIT EXCEEDED!");
      console.log(
        "You have hit the daily limit of 200 requests (Gemini 2.0 Flash)."
      );
      console.log("Solutions:");
      console.log("1. Wait until tomorrow (resets at midnight Pacific time)");
      console.log(
        "2. Upgrade to Tier 1 (10,000 requests/day) - requires billing setup"
      );
      console.log("3. Use a different API key/project");
      console.log(
        "4. Consider using Gemini 2.0 Flash-Thinking (200 requests/day free)"
      );
    } else if (error.message.includes("API_KEY_INVALID")) {
      console.log("\n🚨 INVALID API KEY!");
      console.log("Solutions:");
      console.log("1. Check that your API key is correct in .env file");
      console.log("2. Generate a new API key at https://makersuite.google.com/app/apikey");
      console.log("3. Make sure billing is enabled if using paid features");
    } else if (error.message.includes("MODEL_NOT_FOUND")) {
      console.log("\n🚨 MODEL NOT FOUND!");
      console.log(`The model "${MODEL_CONFIG.model}" is not available.`);
      console.log("Solutions:");
      console.log("1. Try 'gemini-2.0-flash-exp' or 'gemini-1.5-flash'");
      console.log("2. Run 'node test-models.js' to see available models");
      console.log("3. Update model-config.js with a working model");
    }
  }
}

if (require.main === module) {
  checkApiUsage().catch(console.error);
}

module.exports = { checkApiUsage };
