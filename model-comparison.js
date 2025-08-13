const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Official rate limits from Google AI documentation
const rateLimits = {
  "gemini-2.0-flash-exp": {
    free: { rpd: 200, rpm: 15 },
    tier1: { rpd: 10000, rpm: 1000 },
    tier2: { rpd: 100000, rpm: 10000 },
    tier3: { rpd: 5000000000, rpm: 10000 },
  },
  "gemini-2.0-flash-thinking-exp": {
    free: { rpd: 200, rpm: 30 },
    tier1: { rpd: 10000, rpm: 1000 },
    tier2: { rpd: 100000, rpm: 10000 },
    tier3: { rpd: 5000000000, rpm: 30000 },
  },
  "gemini-1.5-flash": {
    free: { rpd: 50, rpm: 15 },
    tier1: { rpd: 2000, rpm: 2000 },
    tier2: { rpd: 10000, rpm: 10000 },
    tier3: { rpd: 10000, rpm: 10000 },
  },
};

function displayModelComparison() {
  console.log("🚀 GEMINI MODEL RATE LIMITS COMPARISON\n");
  console.log("=====================================\n");

  Object.entries(rateLimits).forEach(([model, limits]) => {
    console.log(`📊 ${model.toUpperCase()}:`);
    console.log(
      `   🆓 Free Tier:     ${limits.free.rpd.toLocaleString()} requests/day, ${
        limits.free.rpm
      } requests/minute`
    );
    console.log(
      `   💰 Tier 1:        ${limits.tier1.rpd.toLocaleString()} requests/day, ${
        limits.tier1.rpm
      } requests/minute`
    );
    console.log(
      `   💰💰 Tier 2:      ${limits.tier2.rpd.toLocaleString()} requests/day, ${
        limits.tier2.rpm
      } requests/minute`
    );
    console.log(
      `   💰💰💰 Tier 3:    ${limits.tier3.rpd.toLocaleString()} requests/day, ${
        limits.tier3.rpm
      } requests/minute`
    );
    console.log("");
  });

  console.log("🎯 RECOMMENDATIONS:\n");
  console.log("==================");

  // Find the model with highest free tier
  const bestFreeModel = Object.entries(rateLimits).reduce(
    (best, [model, limits]) => {
      return limits.free.rpd > best.limits.free.rpd ? { model, limits } : best;
    },
    { model: "", limits: { free: { rpd: 0 } } }
  );

  console.log(`🥇 BEST FREE TIER: ${bestFreeModel.model.toUpperCase()}`);
  console.log(
    `   • ${bestFreeModel.limits.free.rpd} requests/day (${bestFreeModel.limits.free.rpm} requests/minute)`
  );
  console.log(`   • 4x more than gemini-1.5-flash`);
  console.log("");

  // Find the model with highest tier 1
  const bestTier1Model = Object.entries(rateLimits).reduce(
    (best, [model, limits]) => {
      return limits.tier1.rpd > best.limits.tier1.rpd
        ? { model, limits }
        : best;
    },
    { model: "", limits: { tier1: { rpd: 0 } } }
  );

  console.log(`🥇 BEST PAID TIER: ${bestTier1Model.model.toUpperCase()}`);
  console.log(
    `   • Tier 1: ${bestTier1Model.limits.tier1.rpd.toLocaleString()} requests/day`
  );
  console.log(
    `   • Tier 2: ${bestTier1Model.limits.tier2.rpd.toLocaleString()} requests/day`
  );
  console.log(
    `   • Tier 3: ${bestTier1Model.limits.tier3.rpd.toLocaleString()} requests/day`
  );
  console.log("");

  console.log("💡 UPGRADE PATH:\n");
  console.log("===============");
  console.log("1. 🆓 Free Tier: Use gemini-2.0-flash-exp (200 requests/day)");
  console.log("2. 💰 Tier 1: Set up billing → 10,000 requests/day");
  console.log("3. 💰💰 Tier 2: $250+ spend → 100,000 requests/day");
  console.log("4. 💰💰💰 Tier 3: $1,000+ spend → 5,000,000,000 requests/day");
  console.log("");

  console.log("⚡ SPEED COMPARISON:\n");
  console.log("===================");
  console.log("• gemini-2.0-flash-exp: Fastest, best quality");
  console.log("• gemini-2.0-flash-thinking-exp: Fastest, reasoning capabilities");
  console.log("• gemini-1.5-flash: Slower, deprecated");
  console.log("");

  console.log("🎯 FINAL RECOMMENDATION:\n");
  console.log("=======================");
  console.log("✅ Use gemini-2.0-flash-exp for best balance of speed and quality");
  console.log("✅ For reasoning tasks, use gemini-2.0-flash-thinking-exp");
  console.log(
    "✅ Both give you 200 requests/day free (4x more than 1.5-flash)"
  );
  console.log("✅ Upgrade to paid tiers for 10,000+ requests/day");
}

if (require.main === module) {
  displayModelComparison();
}

module.exports = { displayModelComparison, rateLimits };
