import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Marketplace | Writer's Thing",
  description: "Buy and sell premium literary content and services.",
  alternates: {
    canonical: 'https://www.writersthing.com/marketplace',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
