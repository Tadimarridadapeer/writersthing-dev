require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkCounts() {
  const [s, b, bk, a] = await Promise.all([
    supabase.from('stories').select('id', { count: 'exact', head: true }).eq('status', 'Published'),
    supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('status', 'Published'),
    supabase.from('books').select('id', { count: 'exact', head: true }).eq('status', 'Published'),
    supabase.from('authors').select('id', { count: 'exact', head: true }),
  ]);
  console.log('Stories:', s.count);
  console.log('Blogs:', b.count);
  console.log('Books:', bk.count);
  console.log('Authors:', a.count);
}
checkCounts();
