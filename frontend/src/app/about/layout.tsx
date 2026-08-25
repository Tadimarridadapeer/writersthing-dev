import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About | Writer's Thing",
  description: "Learn about the mission and ecosystem of Writer's Thing.",
  alternates: {
    canonical: 'https://www.writersthing.com/about',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
