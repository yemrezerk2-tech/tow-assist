import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'
import Header from '@/components/Header';
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
      <body className={inter.className}>
        <Header/> 
        <ErrorBoundary>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
            
            {/* Footer with legal links */}
            <footer className="bg-gray-900 text-white py-8">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <p className="text-gray-400">
                      © {new Date().getFullYear()} Road Help GmbH. Alle Rechte vorbehalten.
                    </p>
                  </div>
                  
                  <div className="flex space-x-6">
                    <Link 
                      href="/impressum" 
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Impressum
                    </Link>
                    <Link 
                      href="/datenschutz" 
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Datenschutz
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}