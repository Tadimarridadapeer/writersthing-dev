const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: allStories } = await supabase.from("stories").select("*");
  
  if (!allStories || allStories.length === 0) return;
  
  const allKeys = new Set();
  allStories.forEach(s => Object.keys(s).forEach(k => allKeys.add(k)));
  
  console.log("All unique columns ever returned for stories:", Array.from(allKeys).join(", "));
  
  // Let's check every single column for anything that looks like an image URL
  for (const s of allStories) {
    for (const [k, v] of Object.entries(s)) {
      if (typeof v === 'string' && (v.includes('http') || v.includes('.jpg') || v.includes('.png') || v.includes('.webp') || v.includes('storage'))) {
        console.log(`Story ${s.id} has URL in ${k}: ${v}`);
      }
    }
  }
}
run();
