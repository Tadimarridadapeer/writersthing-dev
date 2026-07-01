import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfrtmxqancvfanoqkmrv.supabase.co';
const supabaseKey = 'sb_publishable_kCC-e_BgAtCle0mefPou6A_9XKl5XVl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAuthor() {
  // Let's get the author name of the article "art"
  const { data, error } = await supabase
    .from("articles")
    .select("*, authors:author_id(id, user_id, users:user_id(name))")
    .ilike("title", "%art%");
    
  if (data && data.length > 0) {
    const artAuthorId = data[0].authors.id;
    const artUserId = data[0].authors.user_id;
    console.log("Article 'art' author_id:", artAuthorId);
    console.log("Article 'art' user_id:", artUserId);
    
    // Let's update the book to use THIS author_id!
    const { error: updErr } = await supabase
      .from("books")
      .update({ author_id: artAuthorId })
      .ilike("title", "%THE ART OF PROMPT%");
      
    if (updErr) console.error("Error updating book:", updErr);
    else console.log("Successfully fixed the book's author_id to point to the valid user.");
  }
}

fixAuthor();
