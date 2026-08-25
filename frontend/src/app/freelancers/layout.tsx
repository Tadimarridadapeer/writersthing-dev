import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hire a Writer | Writer's Thing",
  description: "Connect with experienced freelance writers for your project.",
  alternates: {
    canonical: 'https://www.writersthing.com/freelancers',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
