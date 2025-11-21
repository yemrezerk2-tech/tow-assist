import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel - Pannenhelfer',
  description: 'Admin Panel fur Pannenhelfer Hamburg',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  )
}