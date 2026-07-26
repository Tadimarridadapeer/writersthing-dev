const fs = require('fs');
const path = require('path');

const files = [
  { path: 'src/app/blogs/[id]/page.tsx', idVar: 'blog.id', type: 'blog', authorVar: 'blog.author_id' },
  { path: 'src/app/stories/[id]/page.tsx', idVar: 'story.id', type: 'story', authorVar: 'story.author_id' },
  { path: 'src/app/book/[id]/page.tsx', idVar: 'book.id', type: 'book', authorVar: 'book.author_id' },
  { path: 'src/app/read/[id]/page.tsx', idVar: 'book.id', type: 'book', authorVar: 'book.author_id' }
];

for (const { path: p, idVar, type, authorVar } of files) {
  const fullPath = path.join(__dirname, p);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Add import if not present
  if (!content.includes('ReviewSection')) {
    content = content.replace(
      'import { OptimizedImage } from "@/components/OptimizedImage";',
      'import { OptimizedImage } from "@/components/OptimizedImage";\nimport { ReviewSection } from "@/components/ReviewSection";'
    );
  }
  
  // Replace old comments block
  // Old comment block starts with {/* Social Stats Summary (Interactive) */} or {/* Comments Section */}
  // But actually the best way is to inject it at the bottom.
  // Wait, I will just append it before </article> if it doesn't already have it.
  if (!content.includes('<ReviewSection')) {
    content = content.replace(
      '</article>',
      `  <ReviewSection contentId={${idVar}} contentType="${type}" authorId={${authorVar}} />\n        </article>`
    );
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Injected ReviewSection into readers');
