require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_ANON_KEY exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

async function testSupabase() {
  try {
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Testing connection by checking if resume_analyses table exists...');
    
    // Try querying the resume_analyses table
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error querying resume_analyses table:', error);
      
      if (error.code === '42P01') { // Table does not exist
        console.log('\nThe resume_analyses table does not exist. You need to create it using the SQL in supabase_schema.sql');
        console.log('1. Go to your Supabase project');
        console.log('2. Go to the SQL Editor');
        console.log('3. Run the SQL from supabase_schema.sql');
      } else {
        console.log('\nThere seems to be an issue with your Supabase configuration or permissions:');
        console.log('- Check that your SUPABASE_URL and SUPABASE_ANON_KEY are correct');
        console.log('- Verify that your Supabase project is active');
        console.log('- Make sure you have the right permissions');
      }
    } else {
      console.log('Successfully connected to resume_analyses table!');
      console.log('Found data:', data ? `${data.length} records` : 'No records');
      
      // Test inserting a dummy record
      console.log('\nTesting record insertion...');
      const testRecord = {
        job_description: 'Test job description',
        resume_name: 'test-resume.pdf',
        resume_id: 'test-id-123',
        skills_match: 7,
        experience_relevance: 8,
        education_fit: 6,
        project_impact: 7,
        key_strengths: ['Test strength 1', 'Test strength 2'],
        areas_for_improvement: ['Test area 1'],
        total_score: 70,
        analysis_text: 'This is a test analysis'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('resume_analyses')
        .insert([testRecord])
        .select();
      
      if (insertError) {
        console.error('Error inserting test record:', insertError);
        
        if (insertError.code === '42P01') {
          console.log('\nThe resume_analyses table does not exist. Create it using the SQL in supabase_schema.sql');
        } else if (insertError.details && insertError.details.includes('violates check constraint')) {
          console.log('\nThe insert failed due to constraint violations. Check your data structure.');
        } else if (insertError.code === '42703') {
          console.log('\nColumn mismatch: The table structure doesn\'t match what we\'re trying to insert.');
          console.log('Make sure you\'ve created the table exactly as specified in supabase_schema.sql');
        } else if (insertError.code === '23505') {
          console.log('\nUnique constraint violation: A record with this ID already exists.');
        } else {
          console.log('\nUnexpected error when inserting. Check your Supabase setup and permissions.');
        }
      } else {
        console.log('Successfully inserted test record!');
        console.log('Inserted record ID:', insertData && insertData[0] ? insertData[0].id : 'unknown');
        
        // Clean up the test record
        if (insertData && insertData[0] && insertData[0].id) {
          const { error: deleteError } = await supabase
            .from('resume_analyses')
            .delete()
            .eq('id', insertData[0].id);
          
          if (deleteError) {
            console.error('Error deleting test record:', deleteError);
          } else {
            console.log('Successfully deleted test record');
          }
        } else {
          console.log('No ID received for the inserted record, skipping deletion');
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error during Supabase test:', error);
    console.log('\nThis could be due to:');
    console.log('1. Network connectivity issues');
    console.log('2. Invalid Supabase URL or API key');
    console.log('3. Supabase service outage');
    console.log('\nPlease check your .env file and Supabase settings.');
  }
}

testSupabase()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed with error:', err)); 