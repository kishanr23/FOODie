import type { Metadata, Viewport } from 'next';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import { Providers } from '@/components/Providers';
import { TopNav } from '@/components/layout/TopNav';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#080c09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <div className="page">
            <TopNav />
            {children}
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
