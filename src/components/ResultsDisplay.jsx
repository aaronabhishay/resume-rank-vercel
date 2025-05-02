import React, { useState } from "react";

export default function ResultsDisplay({ results }) {
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  const [showSummary, setShowSummary] = useState(false);
  
  console.log("Results in component:", results);
  
  // Check if results is undefined or null
  if (!results) {
    return null;
  }

  // Extract candidates from the results object
  const candidates = results.candidates || [];
  const warning = results.warning;
  
  // Check if there are no candidates
  if (candidates.length === 0) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Results</h2>
        <p className="text-gray-600">No candidate data available to display.</p>
      </div>
    );
  }
  
  // Check if results is an error object
  if (results && results.error) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-800">{results.message}</p>
        {results.stack && (
          <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto">
            {results.stack}
          </pre>
        )}
      </div>
    );
  }
  
  // Generate comparative summary
  const generateSummary = () => {
    if (!candidates || candidates.length === 0) return null;
    
    // Filter out error results
    const validResults = candidates.filter(r => !r.error);
    
    if (validResults.length === 0) return null;
    
    // Find top candidate
    const topCandidate = validResults[0]; // Already sorted by totalScore
    
    // Find average scores
    const avgSkills = validResults.reduce((sum, r) => sum + r.skillsMatch, 0) / validResults.length;
    const avgExperience = validResults.reduce((sum, r) => sum + r.experienceRelevance, 0) / validResults.length;
    const avgEducation = validResults.reduce((sum, r) => sum + r.educationFit, 0) / validResults.length;
    const avgProject = validResults.reduce((sum, r) => sum + r.projectImpact, 0) / validResults.length;
    const avgTotal = validResults.reduce((sum, r) => sum + r.totalScore, 0) / validResults.length;
    
    return {
      topCandidate: topCandidate.name,
      topScore: topCandidate.totalScore,
      averageScore: avgTotal.toFixed(1),
      candidateCount: validResults.length,
      topStrengths: topCandidate.keyStrengths,
      comparisons: [
        {
          category: "Skills Match",
          topScore: topCandidate.skillsMatch,
          avgScore: avgSkills.toFixed(1),
        },
        {
          category: "Experience",
          topScore: topCandidate.experienceRelevance,
          avgScore: avgExperience.toFixed(1),
        },
        {
          category: "Education",
          topScore: topCandidate.educationFit,
          avgScore: avgEducation.toFixed(1),
        },
        {
          category: "Project Impact",
          topScore: topCandidate.projectImpact,
          avgScore: avgProject.toFixed(1),
        }
      ]
    };
  };
  
  const summary = generateSummary();
  
  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Results</h2>
        <div className="flex space-x-4">
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
      
      {/* Show warning if present */}
      {warning && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          <p className="font-medium mb-1">Warning</p>
          <p className="text-sm">{warning}</p>
        </div>
      )}
      
      {viewMode === "table" ? (
        <div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skills (0-10)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience (0-10)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Education (0-10)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects (0-10)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall (%)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map((candidate, index) => (
                <tr key={index} className={candidate.error ? "bg-red-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  {candidate.error ? (
                    <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                      {candidate.message}
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {candidate.skillsMatch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {candidate.experienceRelevance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {candidate.educationFit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {candidate.projectImpact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {candidate.totalScore}%
                      </td>
                    </>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
      ) : (
        <div className="space-y-6">
          {candidates.map((candidate, index) => (
            <div
              id={`candidate-${index}`}
              key={index}
              className={`border ${candidate.error ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-lg p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {candidate.name}
                  </h3>
                  <p className="text-sm text-gray-600">{candidate.email}</p>
                </div>
                {!candidate.error && (
                  <div className="text-right">
                    <span className="text-3xl font-bold text-blue-600">
                      {candidate.totalScore}%
                    </span>
                    <p className="text-sm text-gray-500">Overall Match</p>
                  </div>
                )}
              </div>
              
              {candidate.error ? (
                <div>
                  <div className="mb-3 p-3 bg-red-100 rounded-md">
                    <p className="text-red-700 font-medium">{candidate.message}</p>
                  </div>
                  {candidate.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600">Show error details</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                        {candidate.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Skills Match</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(candidate.skillsMatch / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{candidate.skillsMatch}/10</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Experience Relevance</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(candidate.experienceRelevance / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{candidate.experienceRelevance}/10</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Education Fit</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(candidate.educationFit / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{candidate.educationFit}/10</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Project Impact</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(candidate.projectImpact / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{candidate.projectImpact}/10</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Key Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {candidate.keyStrengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Areas for Improvement</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {candidate.areasForImprovement.map((area, i) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Analysis</h4>
                    <p className="text-sm text-gray-600">{candidate.analysis}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Summary Modal */}
      {showSummary && summary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Comparative Summary</h2>
                <button 
                  onClick={() => setShowSummary(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium text-blue-800 mb-2">Top Candidate</h3>
                  <p className="text-lg font-semibold">{summary.topCandidate} ({summary.topScore}%)</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">Candidates Analyzed</p>
                    <p className="text-lg font-medium">{summary.candidateCount}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">Average Score</p>
                    <p className="text-lg font-medium">{summary.averageScore}%</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Category Comparison</h3>
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Score</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {summary.comparisons.map((comp, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm">{comp.category}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{comp.topScore}/10</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{comp.avgScore}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Top Candidate Strengths</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {summary.topStrengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowSummary(false)}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 