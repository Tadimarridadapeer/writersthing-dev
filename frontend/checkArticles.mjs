import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfrtmxqancvfanoqkmrv.supabase.co';
const supabaseKey = 'sb_publishable_kCC-e_BgAtCle0mefPou6A_9XKl5XVl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkArticles() {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, author_id, authors:author_id(id, user_id, users:user_id(name))");
    
  if (data) {
    console.log("Articles:", JSON.stringify(data, null, 2));
  }
}

checkArticles();
