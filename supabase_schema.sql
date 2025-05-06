-- Create resume_analyses table
CREATE TABLE resume_analyses (
  id BIGSERIAL PRIMARY KEY,
  job_description TEXT NOT NULL,
  resume_name TEXT NOT NULL,
  resume_id TEXT NOT NULL,
  skills_match FLOAT NOT NULL,
  experience_relevance FLOAT NOT NULL,
  education_fit FLOAT NOT NULL,
  project_impact FLOAT NOT NULL,
  key_strengths TEXT[] NOT NULL,
  areas_for_improvement TEXT[] NOT NULL,
  total_score FLOAT NOT NULL,
  analysis_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add indexes for common queries
  -- Index on scores for sorting and filtering
  -- Index on timestamps for chronological queries
  -- Index on resume_id for lookups
  CONSTRAINT score_range CHECK (
    skills_match BETWEEN 0 AND 10
    AND experience_relevance BETWEEN 0 AND 10
    AND education_fit BETWEEN 0 AND 10
    AND project_impact BETWEEN 0 AND 10
    AND total_score BETWEEN 0 AND 100
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_resume_analyses_created_at ON resume_analyses(created_at);
CREATE INDEX idx_resume_analyses_total_score ON resume_analyses(total_score);
CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses(resume_id);

-- Enable RLS (Row Level Security)
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (optional, customize as needed)
CREATE POLICY "Allow authenticated users full access" 
  ON resume_analyses 
  USING (auth.role() = 'authenticated');

-- Add comment to table for documentation
COMMENT ON TABLE resume_analyses IS 'Stores resume analysis results against job descriptions'; 