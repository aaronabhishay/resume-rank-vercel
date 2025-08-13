const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function adjustBatchSettings() {
  console.log("🔧 Batch Settings Configuration Tool\n");
  console.log("=====================================\n");

  // Read current config
  let currentConfig;
  try {
    currentConfig = require("./batch-config");
    console.log("📋 Current Configuration:");
    console.log(`   • Batch Size: ${currentConfig.batchSize} resumes at once`);
    console.log(`   • Delay: ${currentConfig.delayMs}ms between batches`);
    console.log(
      `   • Retry Delay: ${currentConfig.retryDelayMs}ms after rate limits`
    );
    console.log("");
  } catch (error) {
    console.log("❌ Could not read current batch-config.js");
    console.log("Creating default configuration...");
    currentConfig = {
      batchSize: 2,
      delayMs: 3000,
      retryDelayMs: 10000
    };
  }

  // Ask user questions
  console.log("🤔 Let's configure your batch processing settings:\n");

  const batchSize = await question(
    `How many resumes should be processed simultaneously? (1-5, current: ${currentConfig.batchSize}): `
  );
  const delayMs = await question(
    `Delay between batches in seconds? (2-10, current: ${currentConfig.delayMs/1000}): `
  );
  const retryDelayMs = await question(
    `Wait time after rate limit errors in seconds? (5-30, current: ${currentConfig.retryDelayMs/1000}): `
  );

  // Convert to numbers
  const newConfig = {
    batchSize: parseInt(batchSize) || currentConfig.batchSize,
    delayMs: (parseInt(delayMs) || currentConfig.delayMs/1000) * 1000,
    maxRetries: 3,
    retryDelayMs: (parseInt(retryDelayMs) || currentConfig.retryDelayMs/1000) * 1000,
    requestsPerMinute: 10,
    requestsPerDay: 180,
    verbose: true,
    showProgress: true,
    continueOnError: true,
    savePartialResults: true,
  };

  // Generate new config file
  const configContent = `// Configuration for batch processing resumes
// Modified by adjust-batch-settings.js on ${new Date().toISOString()}

module.exports = ${JSON.stringify(newConfig, null, 2)};
`;

  // Write to file
  try {
    fs.writeFileSync("./batch-config.js", configContent);
    console.log("\n✅ Configuration updated successfully!");
    console.log("\n📊 New Settings:");
    console.log(`   • Batch Size: ${newConfig.batchSize} resumes at once`);
    console.log(
      `   • Delay: ${newConfig.delayMs / 1000} seconds between batches`
    );
    console.log(
      `   • Retry Delay: ${
        newConfig.retryDelayMs / 1000
      } seconds after rate limits`
    );
    console.log("\n💡 Tips:");
    console.log("   • Smaller batch sizes = less likely to hit rate limits");
    console.log("   • Longer delays = more conservative, safer processing");
    console.log("   • Test with a few resumes first to find optimal settings");
    console.log("   • Monitor your API usage in Google AI Studio dashboard");
    
    console.log("\n🚀 Next Steps:");
    console.log("   • Run 'node check-api-usage.js' to test your API");
    console.log("   • Start with a small batch to verify settings work");
    console.log("   • Monitor processing for any rate limit errors");
  } catch (error) {
    console.log("❌ Error writing configuration:", error.message);
  }

  rl.close();
}

if (require.main === module) {
  adjustBatchSettings().catch(console.error);
}

module.exports = { adjustBatchSettings };
