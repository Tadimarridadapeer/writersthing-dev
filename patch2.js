const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/api/stories/route.ts', 'utf8');

// 1. Add getFallbackImage import + update extractFirstImage signature
content = content.replace(
  'function extractFirstImage(content: string, defaultImage: string) {\n  if (!content) return defaultImage;\n  const match = content.match(/<img[^>]+src=["\'']([^"\'\']+)["\'\']/i);\n  return match ? match[1] : defaultImage;\n}',
  'import { getFallbackImage } from "@/lib/fallbacks";\n\nfunction extractFirstImage(content: string, category: string, id: string) {\n  if (!content) return getFallbackImage(category, id);\n  const match = content.match(/<img[^>]+src=["\'']([^"\'\']+)["\'\']/i);\n  return match ? match[1] : getFallbackImage(category, id);\n}'
);

// 2. Fix story cover_url mapping in GET
content = content.replace(
  'cover_url: item.cover_image || extractFirstImage(item.body, "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800"),',
  'cover_url: item.cover_image || extractFirstImage(item.body, item.category || "General", item.id),'
);

// 3. Fix blog cover_url mapping in GET
content = content.replace(
  'cover_url: item.banner_url || extractFirstImage(item.content, "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=800"),',
  'cover_url: item.banner_url || extractFirstImage(item.content, "Blog", item.id),'
);

// 4. POST: accept both coverUrl and cover_image
content = content.replace(
  'const { title, description, content, category, type, coverUrl, status } = await req.json();',
  'const { title, description, content, category, type, coverUrl, cover_image, status } = await req.json();\n    const resolvedCoverUrl = coverUrl || cover_image || "";'
);

// 5. POST Story insert: use resolvedCoverUrl
content = content.replace(
  '...(coverUrl ? { cover_image: coverUrl } : {}),\n            author_id: authorProfile.id,\n            status: status || (req.headers.get("X-Publish") === "true" ? "Published" : "Draft")',
  '...(resolvedCoverUrl ? { cover_image: resolvedCoverUrl } : {}),\n            author_id: authorProfile.id,\n            status: status || (req.headers.get("X-Publish") === "true" ? "Published" : "Draft")'
);

// 6. POST Blog insert: use resolvedCoverUrl
content = content.replace(
  '...(coverUrl ? { banner_url: coverUrl } : {}),\n            author_id: authorProfile.id\n          }\n        ])\n        .select()\n        .single();\n\n      if (error) throw error;\n\n      // Invalidate blogs cache',
  '...(resolvedCoverUrl ? { banner_url: resolvedCoverUrl } : {}),\n            author_id: authorProfile.id\n          }\n        ])\n        .select()\n        .single();\n\n      if (error) throw error;\n\n      // Invalidate blogs cache'
);

// 7. POST validation: use resolvedCoverUrl for isPublishing check
content = content.replace(
  'const isPublishing = status === "Published" || req.headers.get("X-Publish") === "true";\n    if (isPublishing && !coverUrl) {',
  'const isPublishing = status === "Published" || req.headers.get("X-Publish") === "true";\n    if (isPublishing && !resolvedCoverUrl) {'
);

// 8. PUT: also accept cover_image alias + fix payload spreading  
content = content.replace(
  'const { id, title, description, content, category, type, coverUrl } = await req.json();',
  'const { id, title, description, content, category, type, coverUrl, cover_image: putCoverImage } = await req.json();\n    const putCoverUrl = coverUrl || putCoverImage || "";'
);

// 9. PUT Story update: use putCoverUrl
content = content.replace(
  '...(coverUrl ? { cover_image: coverUrl } : {}),',
  '...(putCoverUrl ? { cover_image: putCoverUrl } : {}),'
);

// 10. PUT Blog update: use putCoverUrl
content = content.replace(
  '...(coverUrl ? { banner_url: coverUrl } : {})',
  '...(putCoverUrl ? { banner_url: putCoverUrl } : {})'
);

// 11. PUT validation: use putCoverUrl
content = content.replace(
  'if (isPublishing && !coverUrl) {\n      const table = type === "Story" ? "stories" : "blogs";',
  'if (isPublishing && !putCoverUrl) {\n      const table = type === "Story" ? "stories" : "blogs";'
);

fs.writeFileSync('frontend/src/app/api/stories/route.ts', content);
console.log('Patch applied. Verifying...');

// Quick sanity check
const result = fs.readFileSync('frontend/src/app/api/stories/route.ts', 'utf8');
console.log('Has getFallbackImage:', result.includes('getFallbackImage'));
console.log('Has resolvedCoverUrl:', result.includes('resolvedCoverUrl'));
console.log('Has putCoverUrl:', result.includes('putCoverUrl'));
console.log('File length:', result.length);
