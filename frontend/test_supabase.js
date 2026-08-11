const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const validUuid = "12345678-1234-1234-1234-123456789012";

  const { data, error } = await supabase
    .from("comments")
    .insert({
      content_type: "blog",
      content_id: validUuid, // Valid UUID to pass type checking
      user_id: validUuid,    // Valid UUID to pass type checking
      comment_text: "test",
      rating: 5
    })
    .select("*, users:user_id(name, avatar_url)")
    .single();

  console.log('Insert with Join Error:', error);
}
check();
