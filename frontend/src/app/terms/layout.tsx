import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Terms of Use | Writer's Thing",
  description: "Terms of Use for Writer's Thing. Read the rules, guidelines, and terms that govern our publishing platform.",
  alternates: {
    canonical: 'https://www.writersthing.com/terms',
  },
  openGraph: {
    title: "Terms of Use | Writer's Thing",
    description: "Terms of Use for Writer's Thing. Read the rules, guidelines, and terms that govern our publishing platform.",
    url: 'https://www.writersthing.com/terms',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
