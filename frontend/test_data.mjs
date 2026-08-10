import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: b, error: e } = await supabase.from('blogs').select('*').in('id', ['2cb241b1-7287-4a7d-95d7-cbd334afef36', '2977056b-996d-4c78-aca4-3fec30ae562a', '7c58b77d-27c4-4c1f-be37-af5e3f1c5f69']);
  console.log('blogs:', b, e?.message);
  
  const { data: a, error: e2 } = await supabase.from('articles').select('*').in('id', ['53bbee32-9b24-49be-807c-59ef7819cd77']);
  console.log('articles:', a, e2?.message);
  
  const { data: m, error: e3 } = await supabase.from('manuscripts').select('*').limit(1);
  console.log('manuscripts:', m, e3?.message);
}
test();
