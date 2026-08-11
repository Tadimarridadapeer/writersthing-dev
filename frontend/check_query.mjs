import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // using anon key to test RLS
);

async function check() {
  const { data, error } = await supabase
    .from('stories')
    .select("id, title, status, author_id, authors:author_id(user_id, users:user_id(name))")
    .eq('status', 'Published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Returned Stories for Anon:", JSON.stringify(data, null, 2));
  }
}

check();
