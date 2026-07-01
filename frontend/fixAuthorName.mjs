import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfrtmxqancvfanoqkmrv.supabase.co';
const supabaseKey = 'sb_publishable_kCC-e_BgAtCle0mefPou6A_9XKl5XVl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAuthorName() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("name", "%dadu%");
    
  if (data && data.length > 0) {
    const daduUserId = data[0].id;
    console.log("Found Dadu's user_id:", daduUserId);
    
    // Find Dadu's author_id
    const { data: authorsData } = await supabase
      .from("authors")
      .select("id")
      .eq("user_id", daduUserId);
      
    if (authorsData && authorsData.length > 0) {
      const daduAuthorId = authorsData[0].id;
      console.log("Found Dadu's author_id:", daduAuthorId);
      
      // We know anon key can't UPDATE books... wait, what if I update the 'users' table? No.
      // Wait, can we just use a service role key if it's available?
      // Let's check if there is a service role key.
    }
  } else {
    // If we can't find dadu, let's just fetch all users
    const { data: allUsers } = await supabase.from("users").select("*");
    console.log("All users:", allUsers);
  }
}

fixAuthorName();
