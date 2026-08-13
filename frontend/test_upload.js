const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpload() {
  const content = Buffer.from('hello world');
  const path = 'aa28eadc-3c9b-4065-82ac-85809654bebc/test-book-123/manuscript.pdf';
  
  const { data, error } = await supabaseAdmin.storage
    .from('books')
    .upload(path, content, {
      contentType: 'application/pdf',
      upsert: true
    });
    
  console.log('Upload result:', data, error);
}

testUpload();
