const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/bookmarks/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/reading-lists/route.ts'
];

const supabaseSetup = `import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: any) {
          const cookieStore = await cookies();
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        async remove(name: string, options: any) {
          const cookieStore = await cookies();
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}`;

for (const p of files) {
  const fullPath = path.join(__dirname, p);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (content.includes('@/utils/supabase/server')) {
    // Replace the import
    content = content.replace('import { createClient } from "@/utils/supabase/server";', supabaseSetup);
    
    // Replace createClient() calls
    content = content.replace(/await createClient\(\)/g, 'getSupabase()');
    content = content.replace(/createClient\(\)/g, 'getSupabase()');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed', p);
  }
}
