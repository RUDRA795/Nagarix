import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'NagariX — AI Urban Intelligence Platform for Nagpur',
    template: '%s | NagariX',
  },
  description:
    'NagariX is Nagpur\'s AI-powered smart city platform. Report civic issues, track complaints, view real-time geospatial intelligence, and interact with the NagariX AI Urban Assistant in English, Hindi, or Marathi.',
  keywords: [
    'NagariX', 'Nagpur', 'smart city', 'NMC', 'civic issues',
    'AI assistant', 'pothole', 'garbage', 'drainage', 'complaint',
    'urban intelligence', 'Maharashtra',
  ],
  authors: [{ name: 'NagariX Platform' }],
  openGraph: {
    title: 'NagariX — AI Urban Intelligence Platform for Nagpur',
    description: 'Report, track and resolve civic issues with AI-powered urban intelligence.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050b18" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <NavBar />
        <main className="page-wrapper">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
