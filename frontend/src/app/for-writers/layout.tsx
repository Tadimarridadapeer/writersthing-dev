import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "For Writers | Writer's Thing",
  description: "Everything you need to write, publish, and monetize your work.",
  alternates: {
    canonical: 'https://www.writersthing.com/for-writers',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
