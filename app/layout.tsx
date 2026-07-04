import type { Metadata, Viewport } from 'next'
import { Cairo, IBM_Plex_Sans_Arabic, Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/SessionProvider'
import { PWARegister } from '@/components/PWARegister'
import { ThemeProvider } from '@/components/ThemeProvider'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

const ibm = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://opengym.openappo.com'),
  title: {
    default: 'OpenGym — إدارة الجيمات بذكاء',
    template: '%s | OpenGym',
  },
  description:
    'منصة متكاملة لإدارة الجيمات: اشتراكات، مدفوعات، تقارير، وأعضاء — كل حاجة في مكان واحد. مصمّمة للجيمات المصرية.',
  keywords: [
    'إدارة جيم',
    'نادي رياضي',
    'اشتراكات',
    'مدفوعات',
    'gym management',
    'مصر',
  ],
  authors: [{ name: 'OpenGym' }],
  creator: 'OpenGym',
  manifest: '/manifest.json',
  applicationName: 'OpenGym',
  appleWebApp: {
    capable: true,
    title: 'OpenGym',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: 'https://opengym.openappo.com',
    siteName: 'OpenGym',
    title: 'OpenGym — إدارة الجيمات بذكاء',
    description: 'منصة متكاملة لإدارة الجيمات في مصر',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenGym — نظام متكامل لإدارة الجيمات',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenGym — إدارة الجيمات بذكاء',
    description: 'منصة متكاملة لإدارة الجيمات في مصر',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-180.png', sizes: '180x180' }],
    shortcut: ['/favicon.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#22C55E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} ${ibm.variable} ${inter.variable}`}
    >
      <head>
        {/* PWA: link manifest explicitly for older browsers */}
        <link rel="manifest" href="/manifest.json" />
        {/* iOS meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="OpenGym" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="min-h-screen bg-app text-strong font-ibm">
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  )
}
