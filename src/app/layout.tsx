import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Header from '@/components/Header';
import Footer from '@/components/Footer' 
import Script from 'next/script'
import { LanguageProvider } from '@/context/LanguageContext';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pannenhilfe & Abschleppdienst - 24/7 Schnelle Hilfe in ganz Deutschland | Road Help',
  description: '24/7 Pannenhilfe und Abschleppdienst in ganz Deutschland. Blitzschnelle Hilfe bei Autopannen innerhalb von 15-30 Minuten. Professionelle Fahrer, transparente Preise, rund um die Uhr verfügbar.',
  keywords: 'pannenhilfe, abschleppdienst, autopanne, strassenhilfe, 24/7, deutschland, auto hilfe, abschleppservice, pannenservice',
  robots: 'index, follow',
  authors: [{ name: 'Road Help GmbH' }],
  creator: 'Road Help GmbH',
  publisher: 'Road Help GmbH',
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  metadataBase: new URL('https://www.getroadhelp.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://www.getroadhelp.com',
    siteName: 'Road Help - Pannenhilfe & Abschleppdienst',
    title: 'Pannenhilfe & Abschleppdienst - 24/7 Schnelle Hilfe in ganz Deutschland',
    description: '24/7 Pannenhilfe und Abschleppdienst. Blitzschnelle Hilfe bei Autopannen in ganz Deutschland innerhalb von 15-30 Minuten.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Road Help - Professionelle Pannenhilfe und Abschleppdienst',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pannenhilfe & Abschleppdienst - 24/7 Schnelle Hilfe',
    description: '24/7 Pannenhilfe und Abschleppdienst in ganz Deutschland. Blitzschnelle Hilfe bei Autopannen.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'PLACEHOLDER',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        {/* Google Analytics - Global Site Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KV53MLLJM7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KV53MLLJM7');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <LanguageProvider> 
            <div className="min-h-screen flex flex-col">
              <Header /> 
              <main className="flex-1">
                {children}
              </main>
              <Footer /> 
            </div>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}