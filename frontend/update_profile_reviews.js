const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/app/profile/page.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Ensure Star is imported
if (!content.includes('Star,')) {
  content = content.replace('import {', 'import { Star,');
}

// 2. Add Nav Button
if (!content.includes('label="Reviews"')) {
  const btn = `<ProfileNavBtn icon={<Star size={18} />} label="Reviews" active={activeSection === "Reviews"} onClick={() => setActiveSection("Reviews")} />
                `;
  content = content.replace('<ProfileNavBtn icon={<Book size={18} />} label="My Library"', btn + '<ProfileNavBtn icon={<Book size={18} />} label="My Library"');
}

// 3. Add Section UI
const reviewsUI = `
                  {activeSection === "Reviews" && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                        <h2 className="text-2xl font-black font-heading uppercase tracking-tight">My Reviews</h2>
                      </div>
                      <div className="py-20 text-center text-zinc-400">
                        <Star size={24} className="mx-auto mb-2 opacity-50 text-zinc-300" />
                        <p className="text-xs">Your written and received reviews will appear here.</p>
                      </div>
                    </div>
                  )}
`;

if (!content.includes('activeSection === "Reviews"')) {
  content = content.replace('{activeSection === "Bookmarks" && (', reviewsUI + '\n                  {activeSection === "Bookmarks" && (');
}

fs.writeFileSync(p, content, 'utf8');
console.log('Profile updated for Reviews');
