# Using Gemini 1.5 Flash with Resume Ranker

This guide explains how to set up and use Google's Gemini 1.5 Flash API with the Resume Ranker application.

## What is Gemini 1.5 Flash?

Gemini 1.5 Flash is Google's fast and cost-effective AI model for text generation and analysis. It offers:

- Faster inference speeds (lower latency)
- Lower cost per request compared to Pro models
- Good balance of quality and performance
- Support for analyzing longer input texts

## Getting a Valid API Key

1. **Go to Google AI Studio**:
   - Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create an API Key**:
   - Click "Create API Key"
   - Name your key (e.g., "Resume-Ranker-Key") 
   - Copy the generated API key

3. **Set Up Environment Variable**:
   - Create a `.env` file in the project root
   - Add this line: `GEMINI_API_KEY=your_api_key_here`
   - Replace `your_api_key_here` with your actual API key

## Testing Your API Key

To test if your API key works with Gemini 1.5 Flash:

```
node gemini-flash-example.js
```

If successful, you'll see the resume analysis results in your console.

## Configuration Options

The application uses these configuration settings for optimal results:

```javascript
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.4,         // Lower for more focused output
    topP: 0.8,                // Controls response diversity
    topK: 40,                 // Another diversity control
    maxOutputTokens: 2048,    // Limits response length
  }
});
```

You can adjust these settings in `server.js` if needed:

- **temperature**: Higher (0.7-1.0) for more creative results, lower (0.2-0.5) for more focused
- **maxOutputTokens**: Increase if you need longer responses
- **topP** and **topK**: Advanced parameters for controlling response diversity

## Troubleshooting

### Common Errors:

1. **API Key Invalid/Expired**:
   - Generate a new API key in Google AI Studio
   - Make sure your account has billing set up if required

2. **Model Not Found**:
   - Verify the model name is correct (`gemini-1.5-flash`)
   - If still failing, try other model versions (`gemini-1.5-flash-002`)

3. **Rate Limit Exceeded**:
   - Google limits the number of requests per minute
   - Implement request throttling or wait before trying again

4. **Invalid JSON Response**:
   - Check your prompt to ensure it clearly requests JSON format
   - Add more explicit formatting instructions in your prompt

## Comparing Gemini Models

- **Gemini 1.5 Flash**: Best for speed and cost efficiency
- **Gemini 1.5 Pro**: Better for more complex analysis, but slower and more expensive
- **Gemini 1.5 Flash-8B**: Most cost-effective, good for simpler tasks

For resume ranking, Gemini 1.5 Flash offers the best balance of performance and cost.

## Need Help?

- Google AI documentation: [https://ai.google.dev/models/gemini](https://ai.google.dev/models/gemini)
- API reference: [https://ai.google.dev/api/rest/v1/models](https://ai.google.dev/api/rest/v1/models) 