const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', 'f20ec27a-45ef-4cca-8586-5fb6bbfcb682')
    .single();
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Full Story Record:");
  console.log(JSON.stringify(story, null, 2));
}
run();
