const fs = require('fs');
const path = require('path');

const routes = [
  '',
  'about',
  'authors',
  'blogs',
  'books',
  'careers',
  'city-libraries',
  'community',
  'contact',
  'faqs',
  'for-writers',
  'freelancers',
  'how-hire-writers-work',
  'learn',
  'marketplace',
  'press',
  'stories',
  'terms',
  'privacy'
];

routes.forEach(route => {
  if (route === '') return; // handled globally or index page? Wait, root page is app/page.tsx. It's client? Let's check.
  
  const layoutPath = path.join(__dirname, 'src', 'app', route, 'layout.tsx');
  if (!fs.existsSync(layoutPath)) {
    const content = `import { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.writersthing.com/${route}',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;
    fs.writeFileSync(layoutPath, content);
    console.log('Created', layoutPath);
  }
});
