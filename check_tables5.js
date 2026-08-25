const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const authorId = 'dfbfabdd-74c7-482a-93f5-270b293143b8'; // from stories
  
  const { data: aData } = await supabase.from('authors').select('id, user_id').eq('id', authorId).limit(1);
  console.log("Is it an author id?", aData.length > 0 ? "YES" : "NO", aData);
  
  const { data: uData } = await supabase.from('users').select('id').eq('id', authorId).limit(1);
  console.log("Is it a user id?", uData.length > 0 ? "YES" : "NO", uData);
  
  const { data: uData2 } = await supabase.from('users').select('id').eq('id', '9d0c2282-ab9b-4a10-acfa-f919b9a368ca').limit(1); // books author_id
  console.log("Is books author_id a user id?", uData2.length > 0 ? "YES" : "NO", uData2);
}
check();
