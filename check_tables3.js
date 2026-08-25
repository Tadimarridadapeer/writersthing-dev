const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: fData } = await supabase.from('follows').select('*').limit(1);
  console.log("Follows:", fData);
  const { data: cols } = await supabase.rpc('query_sql', { query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'follows\''});
  console.log("Columns:", cols);
}
check();
