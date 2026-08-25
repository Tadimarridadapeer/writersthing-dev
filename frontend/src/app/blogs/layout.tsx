import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Blogs | Writer's Thing",
  description: "Read the latest thoughts and updates from our community.",
  alternates: {
    canonical: 'https://www.writersthing.com/blogs',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
