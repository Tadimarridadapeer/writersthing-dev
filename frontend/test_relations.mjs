import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: s, error: se } = await supabase.from('stories').select('id, authors:author_id(user_id, users!authors_user_id_fkey(name))').limit(1);
  console.log('stories relation error:', se?.message);
  console.log('stories data:', JSON.stringify(s, null, 2));
  
  const { data: b, error: be } = await supabase.from('blogs').select('id, authors:author_id(user_id, users!authors_user_id_fkey(name))').limit(1);
  console.log('blogs relation error:', be?.message);
  
  const { data: bk, error: bke } = await supabase.from('books').select('id, authors:author_id(user_id, users!authors_user_id_fkey(name))').limit(1);
  console.log('books relation error:', bke?.message);
}
test();
