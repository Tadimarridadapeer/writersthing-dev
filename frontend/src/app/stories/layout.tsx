import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Stories | Writer's Thing",
  description: "Read original short stories from emerging writers.",
  alternates: {
    canonical: 'https://www.writersthing.com/stories',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
