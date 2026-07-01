import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfrtmxqancvfanoqkmrv.supabase.co';
const supabaseKey = 'sb_publishable_kCC-e_BgAtCle0mefPou6A_9XKl5XVl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthor() {
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkAuthor();
