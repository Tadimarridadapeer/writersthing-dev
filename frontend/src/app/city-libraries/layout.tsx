import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "City Libraries | Writer's Thing",
  description: "Discover local writing communities and events.",
  alternates: {
    canonical: 'https://www.writersthing.com/city-libraries',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
