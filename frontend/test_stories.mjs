import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: s, error: e } = await supabase.from('stories').select('*').in('id', ['53bbee32-9b24-49be-807c-59ef7819cd77']);
  console.log('stories:', s, e?.message);
}
test();
