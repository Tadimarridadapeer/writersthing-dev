import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Press | Writer's Thing",
  description: "Press kits, logos, and news about Writer's Thing.",
  alternates: {
    canonical: 'https://www.writersthing.com/press',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
