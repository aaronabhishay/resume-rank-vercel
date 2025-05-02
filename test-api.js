// Test script for Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Get the API key from environment variable
const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE'; // Replace with your actual key if needed

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(apiKey);

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API connection...');
    console.log('API Key (first few chars):', apiKey.substring(0, 10) + '...');
    
    // List available models
    console.log('Fetching available models...');
    
    // Try with gemini-1.5-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = "Write a short joke about programming.";
    console.log('Sending prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Response received successfully:');
    console.log(text);
    console.log('Gemini API is working correctly!');
  } catch (error) {
    console.error('Error testing Gemini API:');
    console.error(error.message);
    
    // Try with a different model if the first one fails
    try {
      console.log('\nTrying with gemini-1.0-pro model instead...');
      const model2 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
      
      const prompt = "Write a short joke about programming.";
      console.log('Sending prompt:', prompt);
      
      const result = await model2.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Response received successfully:');
      console.log(text);
      console.log('Gemini API is working correctly with gemini-1.0-pro!');
    } catch (error2) {
      console.error('Error with gemini-1.0-pro:');
      console.error(error2.message);
      
      console.log('\nAvailable model names might be:');
      console.log('- gemini-pro');
      console.log('- gemini-1.5-pro');
      console.log('- gemini-1.0-pro');
      console.log('Check Google AI documentation for current model names.');
    }
  }
}

// Run the test function
testGeminiAPI(); 