const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeMocks() {
  const { data, error } = await supabase
    .from('story_translations')
    .delete()
    .in('provider', ['MockTranslator', 'mock', 'unknown']);
    
  if (error) {
    console.error("Error purging mocks:", error);
  } else {
    console.log("Mocks purged successfully:", data);
  }
}
purgeMocks();
