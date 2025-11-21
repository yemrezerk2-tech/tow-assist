'use client'

import { useState, useEffect } from 'react'
import ContactForm from '@/components/ContactForm'
import { ArrowLeft, Mail, Phone, Clock, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
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
              className="p-3 pro-card rounded-xl hover:border-blue-500 transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4">
                <span className="text-gray-900">Kontakt</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Wir sind für Sie da. Kontaktieren Sie uns bei Fragen oder Anliegen.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 mb-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="pro-card rounded-2xl p-6 border-2 border-blue-500">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Kontaktinformation</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Telefon</h3>
                      <p className="text-gray-600">+49 40 12345678</p>
                      <p className="text-sm text-gray-500">24/7 erreichbar</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">E-Mail</h3>
                      <p className="text-gray-600">info@pannenhelfer.de</p>
                      <p className="text-sm text-gray-500">Antwort innerhalb 24h</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Öffnungszeiten</h3>
                      <p className="text-gray-600">24 Stunden, 7 Tage die Woche</p>
                      <p className="text-sm text-gray-500">Notdienst immer verfügbar</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Standort</h3>
                      <p className="text-gray-600">Ganz Deutschland</p>
                      <p className="text-sm text-gray-500">Bundesweiter Service</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="pro-card rounded-2xl p-6 border-2 border-yellow-500">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Häufige Fragen</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">Wie schnell kommt Hilfe?</p>
                    <p className="text-gray-600">In der Regel innerhalb von 15-30 Minuten.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Kostenlose Anfrage?</p>
                    <p className="text-gray-600">Ja, die Anfrage ist kostenlos und unverbindlich.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">24/7 verfügbar?</p>
                    <p className="text-gray-600">Ja, rund um die Uhr an 365 Tagen im Jahr.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}