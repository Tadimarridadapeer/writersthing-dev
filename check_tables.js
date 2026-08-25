const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cols, error: err1 } = await supabase.rpc('query_sql', { query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'notifications\''});
  if (err1) {
    console.log("RPC query_sql might not exist, trying standard REST");
    const { data: nData, error: err2 } = await supabase.from('notifications').select('*').limit(1);
    console.log("Notifications:", nData, err2);
    
    const { data: aData, error: err3 } = await supabase.from('authors').select('*').limit(1);
    console.log("Authors:", aData, err3);
    
    const { data: uData, error: err4 } = await supabase.from('users').select('*').limit(1);
    console.log("Users:", uData, err4);
  }
}
check();
