import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false } }
);

function extractDescription(content: string) {
  if (!content) return "Read this blog on Writersthing.";
  const plainText = content.replace(/<[^>]*>?/gm, '').trim();
  return plainText.length > 0 ? plainText.substring(0, 160) + "..." : "Read this blog on Writersthing.";
}

type Props = {
  params: { id: string }
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data: blog } = await supabase
      .from('blogs')
      .select('title, content, banner_url, status')
      .eq('id', id)
      .single();

    if (!blog || blog.status !== 'Published') {
      return {};
    }

    const title = `${blog.title} | Writersthing`;
    const description = extractDescription(blog.content);
    const url = `https://www.writersthing.com/blogs/${id}`;
    
    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        type: 'article',
        images: blog.banner_url ? [{ url: blog.banner_url }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: blog.banner_url ? [blog.banner_url] : undefined,
      },
    };
  } catch (error) {
    return {};
  }
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
