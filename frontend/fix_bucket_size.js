const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
  const { data, error } = await supabaseAdmin.storage.updateBucket('books', {
    public: false,
    file_size_limit: 52428800, // 50MB
    allowed_mime_types: null
  });
  console.log('Update result:', data, error);
}

fix();
