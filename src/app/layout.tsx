import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pannenhelfer - Schnelle Abschleppdienst in Hamburg',
  description: 'Ihr zuverlässiger Partner für Abschleppdienst und Pannenhilfe in Hamburg. 24/7 verfügbar, schnelle Hilfe bei Autopannen.',
  keywords: 'Abschleppdienst, Pannenhilfe, Hamburg, Auto, Panne, Abschleppservice',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}