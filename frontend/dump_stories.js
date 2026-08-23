const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: allStories } = await supabase.from("stories").select("*");
  
  if (!allStories || allStories.length === 0) return;
  
  console.log(JSON.stringify(allStories, null, 2));
}
run();
