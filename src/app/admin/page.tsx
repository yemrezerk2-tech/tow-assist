'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem('admin-authenticated') === 'true'
      const authTime = parseInt(sessionStorage.getItem('admin-auth-time') || '0')
      const currentTime = Date.now()
      const hoursSinceLogin = (currentTime - authTime) / (1000 * 60 * 60)
      
      // Auto-logout after 24 hours
      if (hoursSinceLogin > 24) {
        sessionStorage.removeItem('admin-authenticated')
        sessionStorage.removeItem('admin-auth-time')
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(isAuth)
      }
      
      setIsLoading(false)
      
      if (!isAuth || hoursSinceLogin > 24) {
        router.push('/admin/login')
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('admin-authenticated')
    sessionStorage.removeItem('admin-auth-time')
    router.push('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Uberprufe Anmeldung</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <AdminPanel onClose={handleLogout} />
}