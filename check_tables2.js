const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: bData } = await supabase.from('books').select('id, author_id').limit(1);
  console.log("Books:", bData);
  
  const { data: sData } = await supabase.from('stories').select('id, author_id').limit(1);
  console.log("Stories:", sData);
  
  const { data: blData } = await supabase.from('blogs').select('id, author_id').limit(1);
  console.log("Blogs:", blData);
}
check();
