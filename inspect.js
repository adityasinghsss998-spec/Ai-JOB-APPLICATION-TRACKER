const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing storage access...');
  const { data, error } = await supabase.storage.getBucket('resumes');
  if (error) {
    console.error('Error fetching resumes bucket:', error.message);
  } else {
    console.log('Resumes bucket exists and details are:', data);
  }
}

run().catch(console.error);
