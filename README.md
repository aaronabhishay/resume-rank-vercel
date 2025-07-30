# Resume Ranker

A web application that scores and ranks resumes based on job descriptions using Gemini AI.

## Features

- Enter job descriptions and Google Drive folder links
- Analyze resumes against job requirements
- Score candidates on Skills Match, Experience Relevance, Education Fit, and Project Impact
- Rank candidates by overall suitability
- Visual representation of candidate scores

## Running the Application with Mock Data

If you don't have a valid Gemini API key, you can still run the application with mock data to see how it works:

1. **Start the backend server:**

   ```
   node server.js
   ```

2. **Start the frontend development server:**

   ```
   npm run client
   ```

3. **Access the application:**
   - Open your browser and navigate to: http://localhost:5001
   - Enter any job description and Google Drive link
   - Click "Analyze Resumes" to see the mock results

The mock data provides sample candidate rankings to demonstrate the application's functionality.

## Setting Up with Gemini API

To use real AI analysis:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env` file in the project root:
   ```
   PORT=5000
   GEMINI_API_KEY=your_api_key_here
   ```
3. Update the server code to use the real Gemini API (see GEMINI-GUIDE.md)

## Project Structure

- `src/` - React frontend components and styles
- `public/` - Static assets
- `server.js` - Express backend server with Gemini integration

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express
- **AI:** Google Gemini API
- **Build Tools:** Webpack, Babel

## Development

To contribute to this project:

1. Clone the repository
2. Install dependencies: `npm install`
3. Run in development mode: `npm run dev`

Check the GEMINI-GUIDE.md file for detailed information about working with the Gemini API.

## Deployment

### Vercel Deployment

This application is configured for easy deployment on Vercel. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

Quick deployment steps:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

### Environment Variables

Required for deployment:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `GEMINI_API_KEY`: Your Google Gemini API key

Optional:

- `GOOGLE_SERVICE_ACCOUNT`: Google service account JSON
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## License

MIT
