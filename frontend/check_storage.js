const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.storage.from('books').list('6311a15b-87e8-440d-b2d1-f8afb7f2e87e/6130dcf9-b301-44dc-8b46-e664d18193d4');
  console.log('List of files:', data, error);
}

check();
