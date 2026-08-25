import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Books | Writer's Thing",
  description: "Explore a growing library of original manuscripts.",
  alternates: {
    canonical: 'https://www.writersthing.com/books',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
