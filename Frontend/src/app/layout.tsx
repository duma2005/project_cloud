import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ChatbotWidget } from '@/components/chatbot-widget';
import { GlobalJsonLd } from '@/app/schema-org';
import { AuthProvider } from '@/components/auth-provider';

export const dynamic = 'force-dynamic';
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  //  Đã sửa: Điền cứng URL vào đây
  metadataBase: new URL('https://project-cloud36review.vercel.app'),
  
  title: {
    //  Đã sửa: Điền cứng tên App
    default: 'Pause sas',
    template: `%s`
  },
  description: 'Movie catalog and discovery experience inspired by IMDb.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Pause sas', // 👇 Đã sửa
    title: 'Pause sas',    // 👇 Đã sửa
    description: 'Browse a curated movie catalog with ratings and metadata.',
    url: 'https://project-cloud36review.vercel.app' // 👇 Đã sửa
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pause sas', // 👇 Đã sửa
    description: 'Browse a curated movie catalog with ratings and metadata.'
  },
  robots: {
    index: true,
    follow: true
  }
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {process.env.NODE_ENV === 'development' ? (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
            <Script
              src="//unpkg.com/@react-grab/codex/dist/client.global.js"
              strategy="lazyOnload"
            />
          </>
        ) : null}
      </head>
      <body>
        <AuthProvider>
          <GlobalJsonLd />
          <SiteHeader />
          <main className="min-h-[calc(100vh-160px)] py-8">{children}</main>
          <SiteFooter />
          <ChatbotWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
