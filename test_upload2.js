const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminAuthClient = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  const { data: userData } = await adminAuthClient.auth.admin.createUser({
    email, password, email_confirm: true
  });
  const user = userData.user;

  const { data: signInData } = await anonClient.auth.signInWithPassword({
    email, password
  });
  const token = signInData.session.access_token;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const file = Buffer.from('fake image data');

  console.log("Testing article-images...");
  const path = `${user.id}/test-upload.jpg`;
  const { error: err1 } = await authClient.storage.from('article-images').upload(path, file, { contentType: 'image/jpeg', upsert: false });
  if (err1) console.error("article-images failed:", err1.message);
  else console.log("article-images succeeded!");

  console.log("Testing blog-images with path blogs/user.id...");
  const path2 = `blogs/${user.id}/test.jpg`;
  const { error: err2 } = await authClient.storage.from('blog-images').upload(path2, file, { contentType: 'image/jpeg', upsert: false });
  if (err2) console.error("blog-images failed:", err2.message);
  else console.log("blog-images succeeded!");

  await adminAuthClient.auth.admin.deleteUser(user.id);
}

run().catch(console.error);
