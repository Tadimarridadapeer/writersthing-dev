import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: saves, error: savesErr } = await supabase.from('saves').select('*').limit(5);
  console.log('saves:', saves, savesErr?.message);
  
  const { data: bookmarks, error: bmErr } = await supabase.from('bookmarks').select('*').limit(5);
  console.log('bookmarks:', bookmarks, bmErr?.message);
  
  const { data: likes, error: likesErr } = await supabase.from('likes').select('*').limit(5);
  console.log('likes:', likes, likesErr?.message);
}
test();
