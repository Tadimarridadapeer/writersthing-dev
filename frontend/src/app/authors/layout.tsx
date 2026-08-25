import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Authors | Writer's Thing",
  description: "Discover talented authors and their published works.",
  alternates: {
    canonical: 'https://www.writersthing.com/authors',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
