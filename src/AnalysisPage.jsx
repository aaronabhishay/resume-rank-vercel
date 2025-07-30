import React, { useState } from "react";
import { Briefcase, FileText, BookmarkCheck, Upload, ArrowRight } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import JobDescriptionInput from "./components/JobDescriptionInput";
import DriveFolderInput from "./components/DriveFolderInput";
import ResultsDisplay from "./components/ResultsDisplay";
import GoogleAuth from "./components/GoogleAuth";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // Local backend always on 5000
  : 'https://resume-rank.onrender.com';  // Production

export default function AnalysisPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [driveFolderLink, setDriveFolderLink] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [inputMode, setInputMode] = useState("dropdown");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [jobTitle, setJobTitle] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("job-analysis");
  const [showSavedJobs, setShowSavedJobs] = useState(false);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  const [savedJobsError, setSavedJobsError] = useState("");
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [scoringLogic, setScoringLogic] = useState("Standard scoring based on skills, experience, education, and project impact.");
  const [weights, setWeights] = useState({
    skills: 0.35,
    experience: 0.35,
    education: 0.15,
    projects: 0.15
  });
  const [canSave, setCanSave] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");

  React.useEffect(() => {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleGoogleAuthSuccess = (accessToken) => {
    setGoogleAccessToken(accessToken);
  };

  const handleGoogleAuthError = (error) => {
    console.error('Google authentication error:', error);
  };

  const fetchSavedJobs = async () => {
    setSavedJobsLoading(true);
    setSavedJobsError("");
    try {
      const response = await fetch("/api/saved-jobs");
      const data = await response.json();
      if (data.jobs) {
        setSavedJobs(data.jobs);
      } else {
        setSavedJobsError(data.error || "Failed to fetch saved jobs");
      }
    } catch (err) {
      setSavedJobsError("Failed to fetch saved jobs");
    } finally {
      setSavedJobsLoading(false);
    }
  };

  const handleOpenSavedJobs = () => {
    setShowSavedJobs(true);
    fetchSavedJobs();
  };

  const handleLoadSavedJob = async (id) => {
    setSavedJobsLoading(true);
    setSavedJobsError("");
    try {
      const response = await fetch(`/api/saved-jobs/${id}`);
      const data = await response.json();
      if (data.job && data.job.results) {
        setResults(data.job.results);
        setJobDescription(data.job.job_description);
        setJobTitle(data.job.job_title || "Job Title");
        setTab("candidate-results");
        setShowSavedJobs(false);
        setCanSave(false);
      } else {
        setSavedJobsError(data.error || "Failed to load job");
      }
    } catch (err) {
      setSavedJobsError("Failed to load job");
    } finally {
      setSavedJobsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription || !driveFolderLink || !experienceLevel) {
      alert("Please provide all required information");
      return;
    }
    setTab("candidate-results");
    setJobTitle(jobDescription.split('\n')[0] || "Job Title");
    setCanSave(true);
    setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            jobDescription, 
            driveFolderLink,
            experienceLevel,
            scoringLogic,
            weights,
            accessToken: googleAccessToken
          }),
        });
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Error analyzing resumes:", error);
        alert("Error analyzing resumes. Please try again.");
        setTab("job-analysis");
      } finally {
        setLoading(false);
      }
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation (copied from Dashboard) */}
      <nav className="border-b border-border/40 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Resume Ranker
            </h1>
            <div className="hidden md:flex space-x-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>Dashboard</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/saved-jobs')}>Saved Jobs</Button>
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
            <Button onClick={() => navigate('/analysis')} className="premium-button">
              <FileText className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </nav>
      <main className="flex justify-center py-12">
        <Tabs defaultValue="job-analysis" className="space-y-6" value={tab} onValueChange={setTab}>
          <div className="flex justify-between items-center">
            <TabsList className="w-full flex">
              <TabsTrigger value="job-analysis" className="gap-2 flex-1">
                <Briefcase className="h-4 w-4" />
                Job Analysis
              </TabsTrigger>
              <TabsTrigger value="candidate-results" className="gap-2 flex-1">
                <FileText className="h-4 w-4" />
                Candidate Results
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="job-analysis" className="space-y-6">
            <Card className="w-[1400px] px-4 py-6 md:px-6 md:py-8">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Analyze New Job</CardTitle>
                    <CardDescription>Enter job details to find the best matching candidates</CardDescription>
                  </div>
                  <Badge variant="outline" className="px-3 py-1">
                    <span className="text-xs font-medium">Step 1 of 2</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 flex items-end gap-2">
                    <div className="flex-1">
                      <label htmlFor="experience" className="text-sm font-medium">
                        Experience Level
                      </label>
                      <Select value={experienceLevel} onChange={setExperienceLevel}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder="Select experience..."
                            value={experienceLevel}
                            options={[
                              <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>,
                              <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>,
                              <SelectItem value="senior">Senior (6+ years)</SelectItem>,
                            ]}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                          <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                          <SelectItem value="senior">Senior (6+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowScoringModal(true)}
                    >
                      Edit Scoring Logic
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="job-description" className="text-sm font-medium">
                    Job Description
                  </label>
                  <JobDescriptionInput
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="drive-link" className="text-sm font-medium">
                    Google Drive Folder Link
                  </label>
                  <DriveFolderInput
                    value={inputMode === "dropdown" ? driveFolderId : driveFolderLink}
                    onChange={(value) => {
                      if (inputMode === "dropdown") {
                        setDriveFolderId(value);
                        setDriveFolderLink(`https://drive.google.com/drive/folders/${value}`);
                      } else {
                        setDriveFolderLink(value);
                        // Extract folder ID from the link
                        const match = value.match(/folders\/([a-zA-Z0-9-_]+)/);
                        setDriveFolderId(match ? match[1] : "");
                      }
                    }}
                    onInputModeChange={(mode) => {
                      setInputMode(mode);
                      // Clear the other input when switching modes
                      if (mode === "dropdown") {
                        setDriveFolderLink("");
                      } else {
                        setDriveFolderId("");
                      }
                    }}
                  />
                </div>
                
                {/* Google Drive Authentication */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Google Drive Access
                  </label>
                  <GoogleAuth 
                    onAuthSuccess={handleGoogleAuthSuccess}
                    onAuthError={handleGoogleAuthError}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <div className="flex items-center text-sm text-gray-500">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Supported formats: PDF, DOCX, TXT</span>
                </div>
                <Button onClick={handleAnalyze} disabled={loading} className="flex items-center gap-2" size="sm">
                  {loading ? "Analyzing..." : "Analyze Resumes"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="candidate-results">
            {loading ? (
              <Card className="w-[1400px] px-4 py-6 md:px-6 md:py-8">
                <CardContent>
                  <div className="flex items-center justify-center h-40">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                      <p className="text-lg font-medium">Analyzing Resumes...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : results ? (
              <Card className="w-[1400px] px-4 py-6 md:px-6 md:py-8">
                <CardContent>
                  <ResultsDisplay results={results} jobTitle={jobTitle} canSave={canSave} />
                </CardContent>
              </Card>
            ) : (
              <Card className="w-[1400px] px-4 py-6 md:px-6 md:py-8">
                <CardContent>
                  <div className="flex items-center justify-center h-40 border rounded-md bg-gray-50">
                    <p className="text-gray-500">Select a job analysis to view candidates</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      {/* Saved Jobs Modal */}
      {showSavedJobs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Saved Jobs</h2>
              <button onClick={() => setShowSavedJobs(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            {savedJobsLoading ? (
              <div className="text-gray-600">Loading...</div>
            ) : savedJobsError ? (
              <div className="text-red-600 text-sm mb-2">{savedJobsError}</div>
            ) : savedJobs.length === 0 ? (
              <div className="text-gray-600">No saved jobs found.</div>
            ) : (
              <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {savedJobs.map(job => (
                  <li key={job.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{job.job_title}</div>
                      <div className="text-xs text-gray-500">{new Date(job.created_at).toLocaleString()}</div>
                    </div>
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      onClick={() => handleLoadSavedJob(job.id)}
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {/* Scoring Logic Modal */}
      {showScoringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background dark:bg-background rounded-lg p-6 max-w-lg w-full shadow-lg text-foreground dark:text-foreground">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-foreground">Edit Scoring Logic</h2>
              <button onClick={() => setShowScoringModal(false)} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <label className="text-foreground font-semibold">Skills Weight</label>
              <Input type="number" min="0" max="1" step="0.01" value={weights.skills}
                onChange={e => setWeights({ ...weights, skills: parseFloat(e.target.value) })} />
              <label className="text-foreground font-semibold">Experience Weight</label>
              <Input type="number" min="0" max="1" step="0.01" value={weights.experience}
                onChange={e => setWeights({ ...weights, experience: parseFloat(e.target.value) })} />
              <label className="text-foreground font-semibold">Education Weight</label>
              <Input type="number" min="0" max="1" step="0.01" value={weights.education}
                onChange={e => setWeights({ ...weights, education: parseFloat(e.target.value) })} />
              <label className="text-foreground font-semibold">Projects Weight</label>
              <Input type="number" min="0" max="1" step="0.01" value={weights.projects}
                onChange={e => setWeights({ ...weights, projects: parseFloat(e.target.value) })} />
            </div>
            <div className="mb-4 text-sm text-foreground font-semibold">Total: {(weights.skills + weights.experience + weights.education + weights.projects).toFixed(2)}</div>
            <Textarea
              className="w-full font-mono mb-4 bg-muted text-foreground"
              rows={8}
              value={scoringLogic}
              onChange={e => setScoringLogic(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScoringModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={() => setShowScoringModal(false)}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 