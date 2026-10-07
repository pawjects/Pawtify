import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#1db954',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Pawtify',
  description:
    'A privacy-friendly, browser-based music player featuring local playlist controls, stats, and distraction-free streaming.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/assets/pawtify.png',
    apple: '/assets/pawtify.png',
  },
  openGraph: {
    title: 'Pawtify',
    description:
      'A privacy-friendly, browser-based music player featuring local playlist controls, stats, and distraction-free streaming.',
    type: 'website',
    images: ['/assets/pawtify.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pawtify',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
