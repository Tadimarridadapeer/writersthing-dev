import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false } }
);

function extractDescription(content: string) {
  if (!content) return "Read this book on Writersthing.";
  const plainText = content.replace(/<[^>]*>?/gm, '').trim();
  return plainText.length > 0 ? plainText.substring(0, 160) + "..." : "Read this book on Writersthing.";
}

type Props = {
  params: { id: string }
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data: book } = await supabase
      .from('books')
      .select('title, description, cover_url, status')
      .eq('id', id)
      .single();

    if (!book || book.status !== 'Published') {
      return {};
    }

    const title = `${book.title} | Writersthing`;
    const description = extractDescription(book.description);
    const url = `https://www.writersthing.com/book/${id}`;
    
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
        type: 'book',
        images: book.cover_url ? [{ url: book.cover_url }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: book.cover_url ? [book.cover_url] : undefined,
      },
    };
  } catch (error) {
    return {};
  }
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
