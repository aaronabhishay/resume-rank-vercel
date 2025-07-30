import React, { useState, useEffect } from "react";
import { Briefcase, FileText, BookmarkCheck, Upload, FolderGit2, ArrowRight } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import JobDescriptionInput from "./components/JobDescriptionInput";
import DriveFolderInput from "./components/DriveFolderInput";
import ResultsDisplay from "./components/ResultsDisplay";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./LandingPage";
import DashboardPage from "./DashboardPage";
import AnalysisPage from "./AnalysisPage";
import SavedJobsPage from "./SavedJobsPage";
import AuthPage from "./components/Auth/AuthPage";
import { supabase } from "./supabaseClient";

function ProtectedRoute({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  // Check if this is an OAuth callback
  const urlParams = new URLSearchParams(location.search);
  const isOAuthCallback = urlParams.get('access_token') || urlParams.get('oauth_success');
  
  if (!user && !isOAuthCallback) {
    // Redirect to sign-in, preserving the intended destination
    return <Navigate to={`/auth?view=sign-in&redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  return children;
}

// Dynamically determine backend URL based on environment
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // Local backend always on 5000
  : 'https://resume-rank.onrender.com';  // Production

console.log('Using backend URL:', BACKEND_URL);

const JOB_ROLES = {
  "Select a role...": "",
  "Data Scientist": `Data Scientist

Responsibilities:
- Develop and implement machine learning models and algorithms
- Analyze large datasets to extract meaningful insights
- Create data-driven solutions for business problems
- Collaborate with cross-functional teams to identify opportunities
- Design and maintain data pipelines and ETL processes
- Present findings and recommendations to stakeholders

Requirements:
- Master's or PhD in Computer Science, Statistics, Mathematics, or related field
- Strong programming skills in Python, R, or similar languages
- Experience with machine learning frameworks (TensorFlow, PyTorch, scikit-learn)
- Proficiency in SQL and database management
- Knowledge of statistical analysis and experimental design
- Experience with big data technologies (Hadoop, Spark)
- Strong problem-solving and analytical skills
- Excellent communication and presentation abilities`,

  "Software Engineer": `Software Engineer

Responsibilities:
- Design, develop, and maintain scalable software applications
- Write clean, efficient, and maintainable code
- Collaborate with cross-functional teams to define features
- Perform code reviews and mentor junior developers
- Troubleshoot and debug complex issues
- Implement automated testing and continuous integration
- Optimize application performance and security

Requirements:
- Bachelor's degree in Computer Science or related field
- 3+ years of experience in software development
- Strong proficiency in one or more programming languages (Java, Python, JavaScript)
- Experience with web frameworks (React, Angular, Node.js)
- Knowledge of database systems (SQL, NoSQL)
- Understanding of software design patterns and architecture
- Experience with version control systems (Git)
- Familiarity with cloud platforms (AWS, Azure, GCP)
- Strong problem-solving and analytical skills`
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
      <Route path="/saved-jobs" element={<ProtectedRoute><SavedJobsPage /></ProtectedRoute>} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
} 