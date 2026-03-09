'use client'

import { Driver, Location } from '@/types'
import { Star, Clock, Car, Phone, Check, Shield, Zap, ArrowLeft } from 'lucide-react'
import { useState} from 'react'
import { useLanguage } from '@/context/LanguageContext'
interface DriverListProps {
  drivers: Driver[]
  selectedDriver: Driver | null
  onSelectDriver: (driver: Driver) => void
  userLocation: Location
  onBack: () => void
  onNewRequest?: () => void
}

export default function DriverList({ 
  drivers, 
  selectedDriver, 
  onSelectDriver, 
  userLocation, 
  onBack,
  onNewRequest 
}: DriverListProps) {
  const { t } = useLanguage()
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)
  const [helpId, setHelpId] = useState<string>('')
  // Twilio integration - this is the main contact number
  // Remember to update this in production with the actual Twilio number
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+494012345678'

  const availableDrivers = drivers.filter(driver => driver.available)

  /**
   * Handle assignment creation when user selects a driver
   * This creates the help ID that customers will give to call center agents
   * Call center can look this up in the admin panel to see all details
   */
const confirmDriverAssignment = async (driver: Driver) => {
  setIsCreatingAssignment(true)
  
  try {
    const assignmentId = `ASN${Date.now()}`
    const generatedHelpId = createHelpId()

    const apiCall = await fetch('/api/assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignmentId: assignmentId,
        helpId: generatedHelpId,
        driverId: driver.id,
        userLocation: userLocation,
        status: 'pending',
      }),
    })

    if (!apiCall.ok) {
      const errorData = await apiCall.json()
      throw new Error(errorData.error || 'Assignment creation failed')
    }

    setHelpId(generatedHelpId)
    onSelectDriver(driver)
  } catch (err) {
    console.error('Failed to create assignment record:', err)
    alert('Entschuldigung, es gab ein Problem bei der Zuweisung. Bitte versuchen Sie es erneut.')
  } finally {
    setIsCreatingAssignment(false)
  }
}

const createHelpId = () => {
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return randomDigits
}

  const formatPhoneNumber = (phoneNum: string) => {
    return phoneNum.replace(/(\+49)(\d{2})(\d+)/, '$1 $2 $3')
  }

  // Convert service type codes to German text
  const getServiceTypeText = (serviceType: string) => {
    switch (serviceType) {
      case 'towing': return 'Abschleppdienst'
      case 'repair': return 'Pannenhilfe'
      case 'both': return 'Beides'
      default: return serviceType
    }
  }

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'towing': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'repair': return 'bg-green-100 text-green-800 border-green-300'
      case 'both': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // Calculate estimated arrival times based on distance
  const driversWithEstimates = availableDrivers.map(driverItem => ({
    ...driverItem,
    estimatedArrival: driverItem.estimatedArrival || Math.max(10, Math.floor((driverItem.distance || 1) * 8 + 10))
  }))

  // Show confirmation screen once driver is selected
  if (selectedDriver) {
    return (
      <div className="w-full max-w-2xl mx-auto pro-card rounded-3xl p-8 border-4 border-yellow-500 shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 road-sign rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-gold">
            <Check className="w-10 h-10 text-black" />
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-4">
            {t('assignment.title')}
          </h2>
          
          {/* Selected driver details card */}
          <div className="pro-card rounded-2xl p-6 mb-6 border-2 border-yellow-500">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedDriver.name}</h3>
            <p className="text-gray-600 mb-4">{selectedDriver.description}</p>
            
            {/* Driver stats grid */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">{selectedDriver.estimatedArrival} min</span>
                </div>
                <p className="text-xs text-gray-500">{t('driver.eta')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-600 mb-1">
                  <Star className="w-4 h-4" />
                  <span className="font-bold">{selectedDriver.rating}</span>
                </div>
                <p className="text-xs text-gray-500">{t('driver.rating')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                  <Car className="w-4 h-4" />
                  <span className="font-bold">{selectedDriver.vehicleType}</span>
                </div>
                <p className="text-xs text-gray-500">{selectedDriver.vehicleType}</p>
              </div>
              <div className="text-center">
                <div className={`px-2 py-1 rounded-lg text-xs font-bold border ${getServiceTypeColor(selectedDriver.serviceType)}`}>
                  {getServiceTypeText(selectedDriver.serviceType)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('driver.service_type')}</p>
              </div>
            </div>
          </div> 

          {/* Help ID display - this is the most important part for the call center workflow */}
          <div className="road-sign border-4 border-black rounded-2xl p-6 mb-6 animate-glow">
            <div className="text-center mb-4">
              <Shield className="w-12 h-12 text-black mx-auto mb-2" />
              <h3 className="text-lg font-bold text-black mb-1">{t('assignment.help_id')}</h3>
              <p className="text-gray-700 text-sm mb-4">
                {t('assignment.help_id_desc')}
              </p>
              <div className="text-4xl font-black text-black tracking-wider font-mono bg-black bg-opacity-10 py-2 px-4 rounded-lg">
                {helpId}
              </div>
              <p className="text-gray-700 text-sm mt-3">
                {t('assignment.help_id_note')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Call to action with phone number */}
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4">
              <p className="text-red-700 font-semibold text-center mb-2">
                {t('assignment.call_action')}
              </p>
              <a 
                href={`tel:${contactPhone}`}
                className="inline-flex items-center justify-center w-full road-sign-red rounded-2xl px-8 py-4 text-lg shadow-2xl transform transition-all duration-300 hover:scale-105"
              >
                <Phone className="w-6 h-6 mr-3" />
                {t('assignment.call_button', { phone: formatPhoneNumber(contactPhone) })}
              </a>
            </div>

            {/* Process explanation */}
            <div className="bg-blue-50 border-2 border-blue-500 rounded-2xl p-4">
              <h4 className="font-bold text-blue-900 mb-2 text-center">{t('assignment.how_it_works')}</h4>
              <ol className="text-blue-800 text-sm space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>{t('assignment.step1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>{t('assignment.step2', { id: helpId })} <strong className="font-mono">{helpId}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>{t('assignment.step3')}</span>
                </li>
              </ol>
            </div>

            <button
              onClick={onNewRequest || onBack}
              className="w-full pro-card border-2 border-gray-300 text-gray-700 rounded-2xl py-4 hover:border-yellow-500 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('assignment.new_request')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header section with back button */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-3 pro-card rounded-xl hover:border-yellow-500 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-black text-gray-900">
            {t('driver.title')}
          </h2>
          <p className="text-gray-600 mt-2">
            {t('driver.found', { count: availableDrivers.length })}
            {userLocation && (
              <span className="text-sm text-gray-500 ml-2">
                ({t('location.at') || 'Standort'}: {userLocation.address})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Driver list */}
      <div className="grid gap-6">
        {driversWithEstimates.map((driverItem, idx) => (
          <div 
            key={driverItem.id}
            className="group pro-card rounded-2xl p-6 border-4 border-yellow-500 hover:border-yellow-600 transition-all duration-500 hover-lift"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              <div className="flex-1">
                {/* Driver header with name and ratings */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 road-sign rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{driverItem.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-semibold">{driverItem.rating}/5</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-semibold">{driverItem.distance?.toFixed(1) || '0.0'} km</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{driverItem.description}</p>
                
                {/* Driver info grid*/}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {/* ETA info */}
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold text-sm">{driverItem.estimatedArrival} Min</span>
                  </div>
                  
                  {/* Vehicle info */}
                  <div className="flex items-center gap-2 text-gray-700">
                    <Car className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold text-sm">{driverItem.vehicleType}</span>
                  </div>
                  
                  {/* Pricing info */}
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="font-bold text-sm">{t('driver.price_from', { price: driverItem.basePrice })}</span>
                  </div>
                  
                  {/* Service type badge */}
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${getServiceTypeColor(driverItem.serviceType)} text-center`}>
                    {getServiceTypeText(driverItem.serviceType)}
                  </div>
                </div>

                {/* Service areas display */}
                {driverItem.serviceAreas && driverItem.serviceAreas.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">{t('driver.service_areas')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {driverItem.serviceAreas.slice(0, 3).map((area, areaIndex) => (
                        <span key={areaIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features display */}
                {driverItem.features && driverItem.features.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t('driver.features')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {driverItem.features.slice(0, 3).map((feature, featureIndex) => (
                        <span key={featureIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selection button */}
              <button
                onClick={() => confirmDriverAssignment(driverItem)}
                disabled={isCreatingAssignment}
                className="group relative road-sign font-bold rounded-xl px-8 py-4 transition-all duration-300 hover:scale-105 hover-lift min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingAssignment ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  <span className="relative flex items-center gap-2 justify-center">
                    {t('driver.select')}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </button>
            </div>

            {/* Availability status */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-semibold">Jetzt verfügbar</span>
              <span className="text-sm text-gray-500 ml-auto">
                {t('driver.eta_minutes', { minutes: driverItem.estimatedArrival })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* No drivers available state */}
      {availableDrivers.length === 0 && (
        <div className="text-center pro-card rounded-2xl p-12 border-4 border-yellow-500">
          <div className="w-16 h-16 road-sign rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Keine Fahrer verfügbar</h3>
          <p className="text-gray-600 mb-4">
            {t('driver.no_drivers_desc')}
          </p>
          <button
            onClick={onBack}
            className="road-sign px-6 py-3 font-semibold transition-all duration-300 hover:scale-105"
          >
           {t('driver.other_location')}
          </button>
        </div>
      )}

      {/* Security information card */}
      <div className="mt-8 pro-card rounded-2xl p-6 border-2 border-yellow-500 bg-yellow-50">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 road-sign rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">{t('driver.security_title') || 'Sicher und geschützt'}</h4>
            <p className="text-gray-600 text-sm mb-3">
              {t('driver.security_desc') || 'Alle unsere Fahrer sind geprüft, versichert und zertifiziert. Ihre Daten werden verschlüsselt übertragen und nicht an Dritte weitergegeben.'}
            </p>
            <div className="text-xs text-gray-500">
              {t('driver.security_badges') || '• Geprüfte Fachbetriebe • 24/7 Verfügbarkeit • Festpreis-Garantie'}
            </div>
          </div>
        </div>
      </div>

      {/* Process explanation card */}
      <div className="mt-6 pro-card rounded-2xl p-6 border-2 border-blue-500 bg-blue-50">
      <h4 className="font-bold text-blue-900 mb-3 text-center">{t('driver.how_it_works_title') || 'So erhalten Sie Hilfe:'}</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
          <p className="text-blue-800 font-semibold">{t('driver.step1_title') || 'Fahrer auswählen'}</p>
          <p className="text-blue-600 text-xs">{t('driver.step1_desc') || 'Wählen Sie einen verfügbaren Fahrer'}</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
          <p className="text-blue-800 font-semibold">{t('driver.step2_title') || 'Hilfe-ID erhalten'}</p>
          <p className="text-blue-600 text-xs">{t('driver.step2_desc') || 'Notieren Sie sich Ihre persönliche ID'}</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
          <p className="text-blue-800 font-semibold">{t('driver.step3_title') || 'Hotline anrufen'}</p>
          <p className="text-blue-600 text-xs">{t('driver.step3_desc') || 'Rufen Sie an und nennen Sie Ihre ID'}</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">4</div>
          <p className="text-blue-800 font-semibold">{t('driver.step4_title') || 'Hilfe erhalten'}</p>
          <p className="text-blue-600 text-xs">{t('driver.step4_desc') || 'Der Fahrer kommt zu Ihrem Standort'}</p>
        </div>
      </div>
      </div>
    </div>
  )
}