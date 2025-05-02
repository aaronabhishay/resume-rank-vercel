# Resume Rank

Resume Rank is an AI-powered application that analyzes and ranks resumes against a job description using Google's Gemini AI.

## Features

- Upload resumes through Google Drive
- Analyze resumes against job descriptions
- Score candidates based on skills, experience, education, and project impact
- Identify strengths and areas for improvement for each candidate

## Technology Stack

- Frontend: React with Tailwind CSS
- Backend: Node.js with Express
- AI: Google's Gemini 1.5 Flash AI model
- File Storage: Google Drive API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Google Gemini API key
- Google Service Account for Drive API access

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/resume-rank.git
   cd resume-rank
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following:
   ```
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
   ```

4. Start the development server
   ```
   npm run dev
   ```

## Usage

1. Enter a job description in the text area
2. Provide a link to a Google Drive folder containing resumes in PDF format
3. Click "Analyze Resumes"
4. Review the ranked results with detailed scores and feedback

## Deployment

This application is configured for easy deployment on Vercel. See [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md) for detailed instructions.

## License

This project is licensed under the ISC License. 