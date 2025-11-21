'use client'

import { useState, useEffect } from 'react'
import PartnershipForm from '@/components/PartnershipForm'
import { ArrowLeft, Users, Shield, TrendingUp, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PartnersPage() {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      <div className="absolute inset-0 road-pattern opacity-10"></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-3 pro-card rounded-xl hover:border-yellow-500 transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors" />
            </button>
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4">
                Werden Sie <span className="text-yellow-600">Partner</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Bieten Sie Ihre Abschlepp- und Pannenhilfe-Dienste über unser Netzwerk an und erreichen Sie mehr Kunden
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: TrendingUp,
                title: "Mehr Aufträge",
                description: "Erhalten Sie regelmäßige Einsätze über unser Kunden-Netzwerk"
              },
              {
                icon: Shield,
                title: "Geprüfte Partner",
                description: "Werben Sie mit unserer Qualitätsgarantie und Kundenvertrauen"
              },
              {
                icon: Clock,
                title: "24/7 Support",
                description: "Unser Team unterstützt Sie bei der Auftragsabwicklung"
              }
            ].map((benefit, index) => (
              <div key={index} className="pro-card rounded-2xl p-6 text-center hover-lift">
                <div className="w-12 h-12 road-sign rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Partnership Form */}
          <PartnershipForm />

          {/* Additional Info */}
          <div className="mt-12 pro-card rounded-2xl p-8 border-2 border-yellow-500 bg-yellow-50">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Häufige Fragen</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Wie funktioniert die Provision?</h4>
                  <p className="text-gray-600 text-sm">Wir berechnen eine faire Provision nur bei erfolgreich vermittelten Einsätzen.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Welche Voraussetzungen gibt es?</h4>
                  <p className="text-gray-600 text-sm">Gewerbeanmeldung, Versicherung und zuverlässige Fahrzeuge.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}