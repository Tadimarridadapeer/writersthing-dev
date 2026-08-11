import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('users').select('id, name, bio').limit(1);
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Success, bio column exists:', data);
  }
}
test();
