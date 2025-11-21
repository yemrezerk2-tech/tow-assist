'use client'

import { useState } from 'react'
import { User, Phone, Mail, MessageCircle, Send, Check } from 'lucide-react'

interface ContactFormData {
  name: string
  email: string
  phone: string
  message: string
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const updateFormField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const submitContactForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Send form data to backend API
      const apiResponse = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (apiResponse.ok) {
        setIsSubmitted(true)
        // Clear form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        })
      } else {
        throw new Error('Form submission failed')
      }
    } catch (err) {
      console.error('Contact form submission error:', err)
      alert('Es gab ein Problem beim Senden des Formulars. Bitte versuchen Sie es später erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success state display
  if (isSubmitted) {
    return (
      <div className="w-full max-w-2xl mx-auto pro-card rounded-3xl p-8 border-4 border-green-500 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">Nachricht gesendet!</h2>
        <p className="text-gray-600 mb-6 text-lg">
          Vielen Dank für Ihre Nachricht. Wir werden uns so schnell wie möglich bei Ihnen melden.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="road-sign px-8 py-3 font-semibold transition-all duration-300 hover:scale-105"
        >
          Neue Nachricht senden
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto pro-card rounded-3xl p-8 border-4 border-blue-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Kontaktieren Sie uns</h2>
        <p className="text-gray-600 text-lg">
          Haben Sie Fragen? Wir helfen Ihnen gerne weiter.
        </p>
      </div>

      <form onSubmit={submitContactForm} className="space-y-6">
        {/* Name and phone fields in grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={updateFormField}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              placeholder="Ihr Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Telefon *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={updateFormField}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              placeholder="+49 123 456789"
            />
          </div>
        </div>

        {/* Email field - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            E-Mail Adresse *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={updateFormField}
            required
            className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
            placeholder="ihre@email.de"
          />
        </div>

        {/* Message textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Ihre Nachricht *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={updateFormField}
            rows={5}
            required
            className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
            placeholder="Wie können wir Ihnen helfen?"
          />
        </div>

        {/* Submit button section */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="road-sign px-12 py-4 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center gap-3"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Nachricht senden
              </>
            )}
          </button>
        </div>

        {/* Response time note */}
        <div className="text-center text-sm text-gray-500">
          Wir antworten normalerweise innerhalb von 24 Stunden.
        </div>
      </form>
    </div>
  )
}