'use client'

import { useState } from 'react'
import { Car, User, Phone, Mail, MapPin, Building, Send, Check } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
interface PartnershipFormData {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  serviceType: string
  message: string
}

export default function PartnershipForm() {
  const { t } = useLanguage()
  const [partnershipData, setPartnershipData] = useState<PartnershipFormData>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    serviceType: 'towing',
    message: ''
  })
  
  const [submissionInProgress, setSubmissionInProgress] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Update form field values when user types
  const updateFormData = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setPartnershipData({
      ...partnershipData,
      [e.target.name]: e.target.value
    })
  }

  const submitPartnershipRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmissionInProgress(true)

    try {
      // Send partnership data to backend
      const apiResponse = await fetch('/api/partnership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partnershipData),
      })

      if (apiResponse.ok) {
        setFormSubmitted(true)
        // Reset form data after successful submission
        setPartnershipData({
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          serviceType: 'towing',
          message: ''
        })
      } else {
        throw new Error('Partnership form submission failed')
      }
    } catch (err) {
      console.error('Partnership submission error:', err)
      alert('Es gab ein Problem beim Senden des Formulars. Bitte versuchen Sie es später erneut.')
    } finally {
      setSubmissionInProgress(false)
    }
  }

  // Show success message after form submission
  if (formSubmitted) {
    return (
      <div className="w-full max-w-2xl mx-auto pro-card rounded-3xl p-8 border-4 border-green-500 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">{t('partners.form.success_title')}</h2>
        <p className="text-gray-600 mb-6 text-lg">
          {t('partners.form.success_message')}
        </p>
        <button
          onClick={() => setFormSubmitted(false)}
          className="road-sign px-8 py-3 font-semibold transition-all duration-300 hover:scale-105"
        >
         {t('partners.form.new_request')}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto pro-card rounded-3xl p-8 border-4 border-yellow-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 road-sign rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">{t('partners.form.title')}</h2>
        <p className="text-gray-600 text-lg">
          {t('partners.form.subtitle')}
        </p>
      </div>

      <form onSubmit={submitPartnershipRequest} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company details section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-yellow-500 pb-2">
              {t('partners.form.company_section')}
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
              {t('partners.form.company_label')} *
              </label>
              <input
                type="text"
                name="companyName"
                value={partnershipData.companyName}
                onChange={updateFormData}
                required
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                placeholder={t('partners.form.company_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                {t('partners.form.contact_label')} *
              </label>
              <input
                type="text"
                name="contactPerson"
                value={partnershipData.contactPerson}
                onChange={updateFormData}
                required
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                placeholder={t('partners.form.contact_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                {t('partners.form.email_label')} *
              </label>
              <input
                type="email"
                name="email"
                value={partnershipData.email}
                onChange={updateFormData}
                required
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                placeholder={t('partners.form.email_placeholder')}
              />
            </div>
          </div>

          {/* Service details section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-yellow-500 pb-2">
        {t('partners.form.service_section')}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                {t('partners.form.phone_label')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={partnershipData.phone}
                onChange={updateFormData}
                required
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                placeholder="+49 123 456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
             {t('partners.form.city_label')} *
              </label>
              <input
                type="text"
                name="address"
                value={partnershipData.address}
                onChange={updateFormData}
                required
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                placeholder={t('partners.form.city_placeholder')}
              />
            </div>

            {/* Service type dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
             {t('partners.form.service_type_label')} *
              </label>
              <select
                name="serviceType"
                value={partnershipData.serviceType}
                onChange={updateFormData}
                required
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
              >
                <option value="towing">{t('partners.form.service_towing')}</option>
                <option value="repair">{t('partners.form.service_repair')}</option>
                <option value="both">{t('partners.form.service_both')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optional message field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
      {t('partners.form.message_label')}
          </label>
          <textarea
            name="message"
            value={partnershipData.message}
            onChange={updateFormData}
            rows={4}
            className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
            placeholder={t('partners.form.message_placeholder')}
          />
        </div>

        {/* Form submission button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={submissionInProgress}
            className="road-sign px-12 py-4 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center gap-3"
          >
            {submissionInProgress ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
              {t('partners.form.submit')}
              </>
            )}
          </button>
        </div>

        {/* Footer note about response time */}
        <div className="text-center text-sm text-gray-500">
          {t('partners.form.response_note')}
        </div>
      </form>
    </div>
  )
}