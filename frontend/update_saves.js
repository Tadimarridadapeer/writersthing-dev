const fs = require('fs');
const path = require('path');

const files = [
  'src/app/blogs/[id]/page.tsx',
  'src/app/stories/[id]/page.tsx',
  'src/app/read/[id]/page.tsx'
];

for (const f of files) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) continue;
  
  let content = fs.readFileSync(p, 'utf8');
  
  // Replace handleSave
  const handleSaveRegex = /const handleSave = async \(\) => {[\s\S]*?\} catch \(err\) {[\s\S]*?console\.error\("Save error:", err\);\n\s*\}\n\s*};/m;
  const newHandleSave = `const handleSave = async () => {
    if (!currentUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    const contentUuid = params.id as string;
    const contentType = "${f.includes('blogs') ? 'blog' : (f.includes('stories') ? 'story' : 'book')}";
    try {
      const { success, message } = await toggleBookmark(contentType, contentUuid);
      if (success) {
        setIsSaved(!isSaved);
      } else {
        alert(message);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };`;
  content = content.replace(handleSaveRegex, newHandleSave);
  
  // Ensure useBookmarks is imported
  if (!content.includes('useBookmarks')) {
    content = content.replace('import { ResumeBanner } from "@/components/ResumeBanner";', 'import { ResumeBanner } from "@/components/ResumeBanner";\nimport { useBookmarks } from "@/hooks/useBookmarks";');
    
    // Inject hook call
    const hookInjectRegex = /const \{ initialData, resume \} = useReadingProgress\((.*?)\);/;
    if (content.match(hookInjectRegex)) {
      content = content.replace(hookInjectRegex, `const { initialData, resume } = useReadingProgress($1);\n  const { toggleBookmark, isBookmarked } = useBookmarks();`);
    } else {
      // If it doesn't match for some reason, inject below useParams or something
      content = content.replace('const [likesCount, setLikesCount] = useState(0);', 'const { toggleBookmark, isBookmarked } = useBookmarks();\n  const [likesCount, setLikesCount] = useState(0);');
    }
  }

  // Update setIsSaved in fetch
  const fetchSaveRegex = /const \{ data: save \} = await supabase\s*\.from\("saves"\)\s*\.select\("\*"\)\s*\.eq\("content_id", \w+\)\s*\.eq\("user_id", userObj\.id\)\s*\.maybeSingle\(\);\s*setIsSaved\(!!save\);/m;
  content = content.replace(fetchSaveRegex, 'setIsSaved(!!isBookmarked("' + (f.includes('blogs') ? 'blog' : (f.includes('stories') ? 'story' : 'book')) + '", params.id as string));');
  
  fs.writeFileSync(p, content, 'utf8');
  console.log(`Updated ${f}`);
}
