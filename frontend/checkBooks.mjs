import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfrtmxqancvfanoqkmrv.supabase.co';
const supabaseKey = 'sb_publishable_kCC-e_BgAtCle0mefPou6A_9XKl5XVl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooks() {
  const { data, error } = await supabase
    .from("books")
    .select("*, authors:author_id(user_id, users:user_id(name))")
    .eq("status", "Published")
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data.filter(b => b.title.includes("PROMPT")), null, 2));
  }
}

checkBooks();
