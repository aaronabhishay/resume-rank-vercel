import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { FileText, Calendar, Users, TrendingUp, Eye, Trash2, Plus } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import ResultsDisplay from "./components/ResultsDisplay";

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || "");
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/saved-jobs");
      const data = await response.json();
      if (data.jobs) {
        setSavedJobs(data.jobs);
      } else {
        setError(data.error || "Failed to fetch saved jobs");
      }
    } catch (err) {
      setError("Failed to fetch saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadJob = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/saved-jobs/${id}`);
      const data = await response.json();
      if (data.job && data.job.results) {
        setSelectedJob(data.job);
      } else {
        setError(data.error || "Failed to load job");
      }
    } catch (err) {
      setError("Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm("Are you sure you want to delete this saved job?")) return;
    
    try {
      const response = await fetch(`/api/saved-jobs/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedJobs(savedJobs.filter(job => job.id !== id));
        if (selectedJob && selectedJob.id === id) {
          setSelectedJob(null);
        }
      } else {
        setError("Failed to delete job");
      }
    } catch (err) {
      setError("Failed to delete job");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleNewAnalysis = () => {
    navigate("/analysis");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCandidateCount = (job) => {
    if (job.results && job.results.results) {
      return job.results.results.length;
    }
    return 0;
  };

  const getAverageScore = (job) => {
    if (job.results && job.results.results) {
      const scores = job.results.results
        .filter(r => r.analysis && r.analysis.totalScore)
        .map(r => r.analysis.totalScore);
      
      if (scores.length > 0) {
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return Math.round(avg * 10) / 10;
      }
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Resume Ranker
            </h1>
            <div className="hidden md:flex space-x-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>Dashboard</Button>
              <Button variant="ghost" size="sm" className="bg-primary/10 text-primary">Saved Jobs</Button>
              <Button variant="ghost" size="sm">Templates</Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-muted-foreground hidden md:inline">{userEmail}</span>
            )}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
            <Button onClick={handleNewAnalysis} className="premium-button">
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Saved Jobs</h1>
            <p className="text-muted-foreground">
              View and manage your previously saved job analyses
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading saved jobs...</div>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No saved jobs yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your first analysis to save job results here
            </p>
            <Button onClick={handleNewAnalysis} className="premium-button">
              <Plus className="h-4 w-4 mr-2" />
              Start New Analysis
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Saved Jobs List */}
            <div className="grid gap-4">
              {savedJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {job.job_title}
                          </h3>
                          <Badge variant="secondary">
                            {getCandidateCount(job)} candidates
                          </Badge>
                          {getAverageScore(job) > 0 && (
                            <Badge variant="outline">
                              {getAverageScore(job)}% avg score
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(job.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {getCandidateCount(job)} candidates analyzed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleLoadJob(job.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                        <Button
                          onClick={() => handleDeleteJob(job.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Job Results */}
            {selectedJob && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Results for: {selectedJob.job_title}
                  </h2>
                  <Button
                    onClick={() => setSelectedJob(null)}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
                <ResultsDisplay
                  results={selectedJob.results}
                  jobTitle={selectedJob.job_title}
                  canSave={false}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 