import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { GlobalNagpur3DBackground } from '@/components/cinematic/GlobalNagpur3DBackground';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050814" />
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('nagarix-theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') || 'dark';
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <GlobalNagpur3DBackground />
          <NavBar />
          <main className="page-wrapper" style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
