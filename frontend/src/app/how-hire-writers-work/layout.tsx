import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "How Hiring Works | Writer's Thing",
  description: "Learn how to find and hire the perfect writer.",
  alternates: {
    canonical: 'https://www.writersthing.com/how-hire-writers-work',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
