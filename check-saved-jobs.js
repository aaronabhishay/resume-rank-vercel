const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSavedJobs() {
  try {
    console.log('Checking saved_jobs table...\n');
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('saved_jobs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting records:', countError);
      return;
    }
    
    console.log(`Total saved jobs: ${count}`);
    
    // Get all saved jobs
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id, job_title, created_at, results')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    console.log('\nSaved jobs:');
    data.forEach((job, index) => {
      console.log(`${index + 1}. ID: ${job.id}`);
      console.log(`   Job Title: ${job.job_title}`);
      console.log(`   Created: ${job.created_at}`);
      
      if (job.results && job.results.results) {
        const results = job.results.results;
        console.log(`   Number of candidates: ${results.length}`);
        
        // Calculate average score
        const scores = results.filter(r => r.analysis && r.analysis.totalScore).map(r => r.analysis.totalScore);
        if (scores.length > 0) {
          const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          console.log(`   Average score: ${avgScore.toFixed(1)}%`);
        }
        
        // Show first few candidates
        console.log(`   Sample candidates:`);
        results.slice(0, 3).forEach((result, i) => {
          console.log(`     ${i + 1}. ${result.fileName} - Score: ${result.analysis?.totalScore || 'N/A'}`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSavedJobs(); 