import React, { useState } from "react";

export default function ResultsDisplay({ results }) {
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  const [showSummary, setShowSummary] = useState(false);
  
  // Extract results array from the response object
  const resultsArray = results?.results || [];
  
  // Check if results is an error object
  if (results && results.error) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-800">{results.error}</p>
      </div>
    );
  }
  
  // Generate comparative summary
  const generateSummary = () => {
    if (!resultsArray || resultsArray.length === 0) return null;
    
    // Filter out error results
    const validResults = resultsArray.filter(r => r.analysis);
    
    if (validResults.length === 0) return null;
    
    // Find top candidate
    const topCandidate = validResults[0]; // Already sorted by totalScore
    
    // Find average scores
    const avgSkills = validResults.reduce((sum, r) => sum + r.analysis.skillsMatch, 0) / validResults.length;
    const avgExperience = validResults.reduce((sum, r) => sum + r.analysis.experienceRelevance, 0) / validResults.length;
    const avgEducation = validResults.reduce((sum, r) => sum + r.analysis.educationFit, 0) / validResults.length;
    const avgProject = validResults.reduce((sum, r) => sum + r.analysis.projectImpact, 0) / validResults.length;
    const avgTotal = validResults.reduce((sum, r) => sum + r.analysis.totalScore, 0) / validResults.length;
    
    return {
      topCandidate: topCandidate.fileName,
      topScore: topCandidate.analysis.totalScore,
      averageScore: avgTotal.toFixed(1),
      candidateCount: validResults.length,
      topStrengths: topCandidate.analysis.keyStrengths,
      comparisons: [
        {
          category: "Skills Match",
          topScore: topCandidate.analysis.skillsMatch,
          avgScore: avgSkills.toFixed(1),
        },
        {
          category: "Experience",
          topScore: topCandidate.analysis.experienceRelevance,
          avgScore: avgExperience.toFixed(1),
        },
        {
          category: "Education",
          topScore: topCandidate.analysis.educationFit,
          avgScore: avgEducation.toFixed(1),
        },
        {
          category: "Project Impact",
          topScore: topCandidate.analysis.projectImpact,
          avgScore: avgProject.toFixed(1),
        }
      ]
    };
  };
  
  const summary = generateSummary();
  
  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6 max-w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800">Results</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 rounded ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1 rounded ${viewMode === "cards" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Card View
          </button>
          <button
            onClick={() => setShowSummary(true)}
            className="px-3 py-1 rounded bg-green-600 text-white"
            disabled={!summary}
          >
            View Summary
          </button>
        </div>
      </div>
      
      {viewMode === "table" ? (
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle px-6">
            <div className="overflow-hidden shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Education
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projects
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultsArray.map((candidate, index) => (
                    <tr key={index} className={candidate.error ? "bg-red-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{candidate.fileName}</div>
                          </div>
                        </div>
                      </td>
                      
                      {candidate.error ? (
                        <td colSpan="5" className="px-4 py-3 whitespace-nowrap text-sm text-red-500">
                          {candidate.error}
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {candidate.analysis.skillsMatch}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {candidate.analysis.experienceRelevance}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {candidate.analysis.educationFit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {candidate.analysis.projectImpact}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                            {candidate.analysis.totalScore}
                          </td>
                        </>
                      )}
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setViewMode("cards");
                            // Scroll to the specific candidate card
                            setTimeout(() => {
                              document.getElementById(`candidate-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {resultsArray.map((candidate, index) => (
            <div
              id={`candidate-${index}`}
              key={index}
              className={`border ${candidate.error ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {candidate.fileName}
                  </h3>
                </div>
                {!candidate.error && (
                  <div className="text-right">
                    <span className="text-3xl font-bold text-blue-600">
                      {candidate.analysis.totalScore}
                    </span>
                    <p className="text-sm text-gray-500">Overall Match</p>
                  </div>
                )}
              </div>
              
              {candidate.error ? (
                <div>
                  <div className="mb-3 p-3 bg-red-100 rounded-md">
                    <p className="text-red-700 font-medium">{candidate.error}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Skills Match</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(candidate.analysis.skillsMatch / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{candidate.analysis.skillsMatch}/10</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Experience Relevance</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(candidate.analysis.experienceRelevance / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{candidate.analysis.experienceRelevance}/10</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Education Fit</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(candidate.analysis.educationFit / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{candidate.analysis.educationFit}/10</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Project Impact</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(candidate.analysis.projectImpact / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{candidate.analysis.projectImpact}/10</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Key Strengths:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {candidate.analysis.keyStrengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Areas for Improvement:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {candidate.analysis.areasForImprovement.map((area, i) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium text-gray-700 mb-2">Analysis:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{candidate.analysis.analysis}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showSummary && summary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                Summary Report
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                <span className="text-gray-600 font-medium">Top Candidate:</span>
                <span className="font-medium text-gray-900">{summary.topCandidate}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                <span className="text-gray-600 font-medium">Top Score:</span>
                <span className="font-medium text-gray-900">{summary.topScore}%</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                <span className="text-gray-600 font-medium">Average Score:</span>
                <span className="font-medium text-gray-900">{summary.averageScore}%</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-gray-600 font-medium">Total Candidates:</span>
                <span className="font-medium text-gray-900">{summary.candidateCount}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Top Candidate Strengths:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                {summary.topStrengths.map((strength, i) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Score Comparison:</h4>
              <div className="space-y-4">
                {summary.comparisons.map((comp, i) => (
                  <div key={i}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1">
                      <span className="text-sm font-medium text-gray-700">{comp.category}</span>
                      <span className="text-sm text-gray-600">
                        Top: <span className="font-medium">{comp.topScore}/10</span> | 
                        Avg: <span className="font-medium">{comp.avgScore}/10</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(comp.topScore / 10) * 100}%` }}></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(comp.avgScore / 10) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSummary(false)}
                className="w-full sm:w-auto bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 