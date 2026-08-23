const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const res = await fetch("http://localhost:3000/api/stories?limit=100");
  const json = await res.json();
  
  if (!json.data || json.data.length === 0) {
    console.log("No published stories returned");
    return;
  }
  
  const story = json.data[0];
  console.log("Original cover_url:", story.cover_url);
  
  await supabase.from('stories').update({ cover_image: "https://example.com/test-image.jpg" }).eq('id', story.id);
  
  const res2 = await fetch("http://localhost:3000/api/stories?limit=100");
  const json2 = await res2.json();
  const updated = json2.data.find(s => s.id === story.id);
  console.log("Updated cover_url:", updated.cover_url);
  
  await supabase.from('stories').update({ cover_image: "" }).eq('id', story.id);
}
run();
