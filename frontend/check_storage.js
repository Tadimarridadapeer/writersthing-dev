const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const buckets = ['covers', 'story-images', 'article-images', 'blog-images'];
  const storyId = 'f20ec27a-45ef-4cca-8586-5fb6bbfcb682';
  
  for (const b of buckets) {
    const { data: top } = await supabase.storage.from(b).list('', { limit: 100 });
    if (!top) continue;
    
    for (const f of top) {
      if (f.name.includes(storyId)) {
        console.log(`Found in bucket ${b}: ${f.name}`);
      }
      
      // Check subfolders
      const { data: sub } = await supabase.storage.from(b).list(f.name, { limit: 100 });
      if (sub) {
        for (const sf of sub) {
          if (sf.name.includes(storyId)) {
            console.log(`Found in bucket ${b}/${f.name}: ${sf.name}`);
          }
        }
      }
    }
  }
  console.log("Done checking storage.");
}
run();
