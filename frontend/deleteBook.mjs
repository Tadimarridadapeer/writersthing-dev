import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfrtmxqancvfanoqkmrv.supabase.co';
const supabaseKey = 'sb_publishable_kCC-e_BgAtCle0mefPou6A_9XKl5XVl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteBook() {
  console.log("Searching for book to delete...");
  const { data, error } = await supabase
    .from('books')
    .select('id, title')
    .ilike('title', '%THE ART OF PROMPT%');
    
  if (error) {
    console.error("Error fetching book:", error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("Book not found. Checking case variations...");
    const { data: d2 } = await supabase.from('books').select('id, title');
    const matched = d2?.filter(b => b.title.toLowerCase().includes('art of prompt'));
    if (!matched || matched.length === 0) {
      console.log("Still not found. Here are all books:", d2?.map(b => b.title));
      return;
    }
    for (const b of matched) {
      console.log(`Deleting book: ${b.title} (${b.id})`);
      const { error: delErr } = await supabase.from('books').delete().eq('id', b.id);
      if (delErr) console.error("Error deleting:", delErr);
      else console.log("Deleted successfully.");
    }
    return;
  }

  for (const b of data) {
    console.log(`Deleting book: ${b.title} (${b.id})`);
    const { error: delErr } = await supabase.from('books').delete().eq('id', b.id);
    if (delErr) console.error("Error deleting:", delErr);
    else console.log("Deleted successfully.");
  }
}

deleteBook();
