const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .limit(5);
  console.log("users table (service role)", JSON.stringify(users, null, 2));

  // Also query books with service role
  const { data: books, error: booksError } = await supabase
      .from("books")
      .select("id, title, authors:author_id(user_id, users!authors_user_id_fkey(name))")
      .limit(2);
  console.log("books with service role", JSON.stringify(books, null, 2));
}
run();
