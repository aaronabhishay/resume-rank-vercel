const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    console.log('Checking resume_analyses table...\n');
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('resume_analyses')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting records:', countError);
      return;
    }
    
    console.log(`Total records: ${count}`);
    
    // Get sample data
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('id, job_description, resume_name, total_score, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    console.log('\nSample records:');
    data.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}`);
      console.log(`   Job Description: ${record.job_description.substring(0, 100)}...`);
      console.log(`   Resume Name: ${record.resume_name}`);
      console.log(`   Total Score: ${record.total_score}`);
      console.log(`   Created: ${record.created_at}`);
      console.log('');
    });
    
    // Get unique job descriptions
    const { data: jobs, error: jobsError } = await supabase
      .from('resume_analyses')
      .select('job_description');
    
    if (!jobsError) {
      const uniqueJobs = new Set(jobs.map(j => j.job_description));
      console.log(`Unique job descriptions: ${uniqueJobs.size}`);
      console.log('Job descriptions:');
      uniqueJobs.forEach(job => {
        console.log(`- ${job.substring(0, 80)}...`);
      });
    }
    
    // Get unique resume IDs
    const { data: resumes, error: resumesError } = await supabase
      .from('resume_analyses')
      .select('resume_id');
    
    if (!resumesError) {
      const uniqueResumes = new Set(resumes.map(r => r.resume_id));
      console.log(`\nUnique resume IDs: ${uniqueResumes.size}`);
    }
    
    // Get average score
    const { data: scores, error: scoresError } = await supabase
      .from('resume_analyses')
      .select('total_score');
    
    if (!scoresError && scores.length > 0) {
      const avgScore = scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length;
      console.log(`\nAverage score: ${avgScore.toFixed(1)}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTable(); 