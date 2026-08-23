const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
      .from("authors")
      .select("*")
      .limit(5);
  console.log("authors table", JSON.stringify(data, null, 2));

  const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .limit(5);
  console.log("users table", JSON.stringify(userData, null, 2));
}
run();
