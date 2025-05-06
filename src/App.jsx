import React, { useState } from "react";
import JobDescriptionInput from "./components/JobDescriptionInput";
import DriveFolderInput from "./components/DriveFolderInput";
import ResultsDisplay from "./components/ResultsDisplay";

// Dynamically determine backend URL based on environment
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // Local backend always on 5000
  : 'https://resume-rank.onrender.com';  // Production

console.log('Using backend URL:', BACKEND_URL);

export default function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [driveFolderLink, setDriveFolderLink] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDescription || !driveFolderLink) {
      alert("Please provide both job description and drive folder link");
      return;
    }

    setLoading(true);
    try {
      // API call to backend with absolute URL
      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          driveFolderLink,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error analyzing resumes:", error);
      alert("Error analyzing resumes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Resume Ranker
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <JobDescriptionInput
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          
          <DriveFolderInput
            value={driveFolderLink}
            onChange={(e) => setDriveFolderLink(e.target.value)}
          />
          
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Analyzing..." : "Analyze Resumes"}
          </button>
        </div>

        {results && <ResultsDisplay results={results} />}
      </div>
    </div>
  );
} 