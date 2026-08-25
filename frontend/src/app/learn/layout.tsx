import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Learn | Writer's Thing",
  description: "Resources and guides to improve your craft.",
  alternates: {
    canonical: 'https://www.writersthing.com/learn',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
