require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('stories').select('id, title, cover_image, body').eq('title', 'DEEPAVALI').limit(1);
  if (error) { console.log('Error:', error); return; }
  const story = data[0];
  console.log('Story ID:', story.id);
  console.log('cover_image:', story.cover_image || 'EMPTY');
  
  const body = story.body || '';
  // Count img tags
  const imgCount = (body.match(/<img/gi) || []).length;
  console.log('HTML <img> tags in body:', imgCount);
  
  // Find supabase URLs
  const supabasePattern = /https:\/\/zfrtmxqancvfanoqkmrv\.supabase\.co\/[^\s"'<)]+/g;
  const supabaseImgs = body.match(supabasePattern);
  console.log('Supabase URLs in body:', supabaseImgs ? supabaseImgs.length : 0);
  if (supabaseImgs && supabaseImgs.length > 0) {
    console.log('First supabase URL:', supabaseImgs[0]);
  }
  
  // Check if body contains any image references
  const hasImg = body.includes('<img') || body.includes('![');
  console.log('Has any images:', hasImg);
  
  // Show first 300 chars of body
  console.log('Body start:', body.substring(0, 300));
}
main();
