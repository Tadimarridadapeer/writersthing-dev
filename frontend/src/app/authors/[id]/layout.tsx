import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false } }
);

type Props = {
  params: { id: string }
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params;

  try {
    // 1. Fetch user data directly if possible, or from authors
    const { data: user } = await supabase
      .from('users')
      .select('name, avatar_url')
      .eq('id', id)
      .single();

    if (!user) {
      return {};
    }

    const { data: authorProfile } = await supabase
      .from('authors')
      .select('bio')
      .eq('user_id', id)
      .single();

    const title = `${user.name} | Writersthing Author`;
    const description = authorProfile?.bio 
      ? authorProfile.bio.substring(0, 160) + (authorProfile.bio.length > 160 ? '...' : '')
      : `Read stories and books by ${user.name} on Writersthing.`;
    const url = `https://www.writersthing.com/authors/${id}`;
    
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
        type: 'profile',
        images: user.avatar_url ? [{ url: user.avatar_url }] : undefined,
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: user.avatar_url ? [user.avatar_url] : undefined,
      },
    };
  } catch (error) {
    return {};
  }
}

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
