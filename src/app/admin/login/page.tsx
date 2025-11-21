'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, LogIn } from 'lucide-react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    setTimeout(() => {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN 
      
      if (password === adminToken) {
        sessionStorage.setItem('admin-authenticated', 'true')
        sessionStorage.setItem('admin-auth-time', Date.now().toString())
        router.push('/admin')
      } else {
        setError('Ungultiges Passwort')
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="pro-card rounded-3xl p-8 shadow-2xl border-4 border-yellow-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 road-sign rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600">
              Zugang zum Fahrer-Management
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Passwort
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                placeholder="Passwort eingeben"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full road-sign py-4 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Anmelden
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-xl">
            <p className="text-yellow-700 text-sm text-center">
              Geschutzter Bereich - Nur fur autorisiertes Personal
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}