import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://www.writersthing.com';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: { persistSession: false },
    }
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabase();
  const currentDate = new Date();

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/authors',
    '/blogs',
    '/books',
    '/careers',
    '/city-libraries',
    '/community',
    '/contact',
    '/faqs',
    '/for-writers',
    '/freelancers',
    '/how-hire-writers-work',
    '/learn',
    '/marketplace',
    '/press',
    '/privacy',
    '/stories',
    '/terms',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Helper for dynamic routes
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // 1. Fetch Stories (Published only)
    const { data: stories } = await supabase
      .from('stories')
      .select('id, updated_at, created_at')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (stories) {
      stories.forEach((story) => {
        dynamicRoutes.push({
          url: `${BASE_URL}/stories/${story.id}`,
          lastModified: new Date(story.updated_at || story.created_at || currentDate),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }

    // 2. Fetch Blogs (Not drafts)
    const { data: blogs } = await supabase
      .from('blogs')
      .select('id, updated_at, created_at')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (blogs) {
      blogs.forEach((blog) => {
        dynamicRoutes.push({
          url: `${BASE_URL}/blogs/${blog.id}`,
          lastModified: new Date(blog.updated_at || blog.created_at || currentDate),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }

    // 3. Fetch Books (Published only)
    const { data: books } = await supabase
      .from('books')
      .select('id, updated_at, created_at')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (books) {
      books.forEach((book) => {
        dynamicRoutes.push({
          url: `${BASE_URL}/book/${book.id}`,
          lastModified: new Date(book.updated_at || book.created_at || currentDate),
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      });
    }

    // 4. Fetch Authors (users who are writers/authors)
    // Looking at authors/[id] page, it resolves authors via authors table or founding_writers table
    // For simplicity, we fetch from 'authors' table
    const { data: authors } = await supabase
      .from('authors')
      .select('id, user_id, updated_at')
      .limit(1000);

    if (authors) {
      authors.forEach((author) => {
        dynamicRoutes.push({
          // Using user_id as that's usually the ID used in routing or profile fetcher handles it
          url: `${BASE_URL}/authors/${author.user_id || author.id}`, 
          lastModified: author.updated_at ? new Date(author.updated_at) : currentDate,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    }
  } catch (err) {
    console.error('Error generating sitemap dynamically:', err);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
