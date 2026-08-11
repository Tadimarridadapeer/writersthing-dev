import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zfrtmxqancvfanoqkmrv.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcnRteHFhbmN2ZmFub3FrbXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTI4ODgsImV4cCI6MjA5NDQ4ODg4OH0.0g1_QvTqKxM5n_xM0O1K_l_Z_M0_Z_0_z_M0_Z_0_z_M0"

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data: users } = await supabase.from('users').select('id, name').limit(10);
  console.log("Users:", users);

  const { data: authors } = await supabase.from('authors').select('id, user_id').limit(10);
  console.log("Authors:", authors);

  const { data: stories } = await supabase.from('stories').select('id, author_id, title').limit(10);
  console.log("Stories:", stories);

  const { data: blogs } = await supabase.from('blogs').select('id, author_id, title').limit(10);
  console.log("Blogs:", blogs);

  const { data: founding } = await supabase.from('founding_writers').select('*').limit(10);
  console.log("Founding writers:", founding);
}

main().catch(console.error);
