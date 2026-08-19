import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

// Cloudflare Web Analytics: cookieless, no consent banner needed. The site
// token is public (it ships in the page HTML on every site that uses it), so
// it lives here directly rather than in an env var.
const CF_BEACON_TOKEN = 'cad1759a2ca247789cdbadf1c3060bdf';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Kurtoza · a data-visualization lab', template: '%s' },
  description: 'Custom data visualizations and write-ups about how they are made, and the gap between what models predict and what actually happens.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`theme-light ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Set the theme before paint to avoid a flash for dark-mode visitors. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}var c=document.documentElement.classList;c.remove('theme-light','theme-dark');c.add('theme-'+t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon={`{"token": "${CF_BEACON_TOKEN}"}`}
        />
      </body>
    </html>
  );
}
