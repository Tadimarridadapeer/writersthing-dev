import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "FAQs | Writer's Thing",
  description: "Find answers to frequently asked questions.",
  alternates: {
    canonical: 'https://www.writersthing.com/faqs',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
