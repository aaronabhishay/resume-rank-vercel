-- Database schema update for rate limiting fix
-- Add email column to resume_analyses table if it doesn't exist

DO $$
BEGIN
    -- Check if email column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'resume_analyses' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE resume_analyses ADD COLUMN email TEXT;
        RAISE NOTICE 'Email column added to resume_analyses table';
    ELSE
        RAISE NOTICE 'Email column already exists in resume_analyses table';
    END IF;
END
$$;

-- Verify the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'resume_analyses' 
ORDER BY ordinal_position;

-- Optional: Update RLS policies if needed
-- This policy allows inserts without authentication (for development)
-- Comment out if you want to keep authentication requirements

/*
DROP POLICY IF EXISTS "Allow inserts for all users" ON resume_analyses;

CREATE POLICY "Allow inserts for all users" 
ON resume_analyses 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow reads for all users as well
DROP POLICY IF EXISTS "Allow reads for all users" ON resume_analyses;

CREATE POLICY "Allow reads for all users" 
ON resume_analyses 
FOR SELECT 
TO public 
USING (true);
*/

COMMENT ON COLUMN resume_analyses.email IS 'Candidate email address extracted from resume';
