// Model configuration for Gemini API
// Choose the model based on your needs and rate limits

module.exports = {
  // Model selection  
  model: "gemini-2.0-flash", // Latest Gemini 2.0 Flash - 200 requests/day (4x increase from 1.5 Flash)

  // Model-specific rate limits (from official documentation)
  rateLimits: {
    "gemini-2.0-flash": {
      free: { rpd: 200, rpm: 15 },
      tier1: { rpd: 10000, rpm: 1000 },
      tier2: { rpd: 100000, rpm: 10000 },
      tier3: { rpd: 5000000000, rpm: 10000 },
    },
    "gemini-2.0-flash-001": {
      free: { rpd: 200, rpm: 15 },
      tier1: { rpd: 10000, rpm: 1000 },
      tier2: { rpd: 100000, rpm: 10000 },
      tier3: { rpd: 5000000000, rpm: 10000 },
    },
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
  },

  // Generation configuration
  generationConfig: {
    temperature: 0.2, // Lower temperature for more consistent output
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },

  // Model recommendations
  recommendations: {
    "best": "gemini-2.0-flash", // Latest and greatest - 200 requests/day free
    "alternative": "gemini-2.0-flash-001", // Alternative 2.0 Flash version
    "fallback": "gemini-1.5-flash", // Reliable fallback option - 50 requests/day
  },
};
