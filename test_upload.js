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

  const path = `${user.id}/test-upload.jpg`;
  const file = Buffer.from('fake image data');

  console.log("Testing blog-images...");
  const { error: uploadError } = await authClient.storage.from('blog-images').upload(path, file, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) console.error("Upload failed:", uploadError.message);
  else console.log("Upload succeeded!");

  console.log("Testing covers...");
  const { error: coverError } = await authClient.storage.from('covers').upload(path, file, { contentType: 'image/jpeg', upsert: false });
  if (coverError) console.error("Cover Upload failed:", coverError.message);
  else console.log("Cover Upload succeeded!");

  console.log("Testing story-images (old bucket)...");
  const { error: oldError } = await authClient.storage.from('story-images').upload(path, file, { contentType: 'image/jpeg', upsert: false });
  if (oldError) console.error("Old Upload failed:", oldError.message);
  else console.log("Old Upload succeeded!");

  await adminAuthClient.auth.admin.deleteUser(user.id);
}

run().catch(console.error);
