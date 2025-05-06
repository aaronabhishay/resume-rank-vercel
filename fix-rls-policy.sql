-- Option 1: Disable RLS for the resume_analyses table (easier for development)
ALTER TABLE resume_analyses DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a policy that allows all operations without requiring authentication
-- Uncomment the lines below if you want to keep RLS enabled but allow operations
/*
DROP POLICY IF EXISTS "Allow all operations" ON resume_analyses;

CREATE POLICY "Allow all operations" 
  ON resume_analyses 
  USING (true)  -- This allows all read operations
  WITH CHECK (true);  -- This allows all write operations
*/

-- Add comment to explain the changes
COMMENT ON TABLE resume_analyses IS 'Stores resume analysis results against job descriptions. RLS disabled or configured to allow all operations.'; 