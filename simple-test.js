// Minimal Gemini API test script
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Put your API key directly here for the test
const API_KEY = "AIzaSyBtXB4RBP751Wek5wA37s2cX5WYBjI-TFM"; // Your API key

console.log("Testing Gemini API with key:", API_KEY.substring(0, 10) + "...");
console.log("@google/generative-ai package version:", require('@google/generative-ai/package.json').version);

// Initialize the API
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to check available models
async function listModels() {
  try {
    // This may not work directly with the client library, but including for completeness
    console.log("\nAttempting to list available models...");
    
    // The Node.js library doesn't have a direct way to list models,
    // so we'll use a simple HTTP request
    
    const https = require('https');
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const models = JSON.parse(data);
            console.log("Available models:");
            if (models.models) {
              models.models.forEach(model => {
                console.log(`- ${model.name} (${model.displayName || 'No display name'})`);
                console.log(`  Version: ${model.version || 'Not specified'}`);
                console.log(`  Description: ${model.description || 'No description'}`);
              });
            } else {
              console.log("No models list returned or unexpected format:");
              console.log(models);
            }
            resolve(models);
          } catch (e) {
            console.log("Error parsing response:", e.message);
            console.log("Raw response:", data);
            reject(e);
          }
        });
      }).on('error', (err) => {
        console.log("Error fetching models:", err.message);
        reject(err);
      });
    });
  } catch (error) {
    console.log("Error listing models:", error.message);
  }
}

// Function to test specific models
async function testModels() {
  // First try to list models
  try {
    await listModels();
  } catch (error) {
    console.log("Could not list models, continuing with testing specific models...");
  }
  
  // List of models to try
  const models = [
    "gemini-pro",
    "gemini-1.5-pro", 
    "gemini-1.0-pro",
    "gemini-1.5-flash"
  ];
  
  for (const modelName of models) {
    console.log(`\nTesting model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Try to get model info if possible
      console.log("Model details (if available):");
      try {
        if (model.getModelInfo) {
          const modelInfo = await model.getModelInfo();
          console.log("Model info:", modelInfo);
        }
      } catch (infoError) {
        console.log("Could not get model info:", infoError.message);
      }
      
      const prompt = "Hello, write a one-sentence joke about programming.";
      console.log("Sending request...");
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log("SUCCESS! Model responded with:");
      console.log(text);
      console.log(`✅ Model ${modelName} works!`);
      
      // If successful, no need to try other models
      return modelName;
    } catch (error) {
      console.log(`❌ Error with ${modelName}:`);
      console.log(error.message);
    }
  }
  
  console.log("\n❌ None of the models worked with your API key.");
  console.log("Possible issues:");
  console.log("1. The API key may be expired or invalid");
  console.log("2. You might need to enable the Gemini API in Google Cloud Console");
  console.log("3. The model names might have changed - check the latest documentation");
  
  return null;
}

// Run the test
testModels(); 