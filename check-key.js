// Simple script to check if a Gemini API key is working
const { GoogleGenerativeAI } = require('@google/generative-ai');

// The API key to test
const API_KEY = "AIzaSyDI9q8l80wS6-eZ1APIF9B3ohRmeXEZyrE"; // Your API key

console.log("Testing Gemini API key: " + API_KEY.substring(0, 10) + "...");

// Initialize the API
const genAI = new GoogleGenerativeAI(API_KEY);

// Test function
async function testApiKey() {
  try {
    console.log("Testing with gemini-1.5-flash model...");
    
    // Create a model instance
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });
    
    // Simple prompt
    const prompt = "Write 'Hello World' and nothing else";
    
    console.log("Sending request...");
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("\n✅ SUCCESS! API key is working!");
    console.log("Response received: " + text);
    
    return true;
  } catch (error) {
    console.log("\n❌ ERROR: API key is not working");
    console.log("Error message: " + error.message);
    
    // Check if error message indicates expired key
    if (error.message.includes("API key expired") || error.message.includes("API_KEY_INVALID")) {
      console.log("\nThis API key has expired or is invalid. Please generate a new key from:");
      console.log("https://makersuite.google.com/app/apikey");
    }
    
    return false;
  }
}

// Run the test
testApiKey().then(isWorking => {
  if (isWorking) {
    console.log("\nYou can use this API key in your application!");
  } else {
    console.log("\nPlease get a new API key to use with your application.");
  }
}); 