import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// We need a server-side only client for metadata fetching
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false } }
);

function extractDescription(content: string) {
  if (!content) return "Read this story on Writersthing.";
  const plainText = content.replace(/<[^>]*>?/gm, '').trim();
  return plainText.length > 0 ? plainText.substring(0, 160) + "..." : "Read this story on Writersthing.";
}

type Props = {
  params: { id: string }
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data: story } = await supabase
      .from('stories')
      .select('title, body, category, cover_image, status')
      .eq('id', id)
      .single();

    if (!story || story.status !== 'Published') {
      return {};
    }

    const title = `${story.title} | Writersthing`;
    const description = extractDescription(story.body);
    const url = `https://www.writersthing.com/stories/${id}`;
    
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
        images: story.cover_image ? [{ url: story.cover_image }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: story.cover_image ? [story.cover_image] : undefined,
      },
    };
  } catch (error) {
    return {};
  }
}

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
