'use client'

import { useState, useEffect } from 'react'
import { MapPin, Users, Shield, Clock, Star, ChevronRight, Phone, Sparkles, Zap, Car, Settings, Mail } from 'lucide-react'
import LocationInput from '@/components/LocationInput'
import DriverList from '@/components/DriverList'
import { Driver, Location } from '@/types'
import { useRouter } from 'next/navigation'
import { findClosestDrivers } from '@/lib/geoUtils'


type AppState = 'welcome' | 'location-input' | 'driver-selection' | 'assignment' | 'confirmation'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [isVisible, setIsVisible] = useState(false)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [showAdminButton, setShowAdminButton] = useState(false)
  const [closestDrivers, setClosestDrivers] = useState<Driver[]>([])
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)
  
  const router = useRouter()

  const getStepFromURL = (): AppState => {
  if (typeof window === 'undefined') return 'welcome'
  const params = new URLSearchParams(window.location.search)
  const step = params.get('step')
  if (step && ['welcome', 'location-input', 'driver-selection', 'assignment'].includes(step)) {
    return step as AppState
  }
  return 'welcome'
}
  // Handle initial page load animations and setup
  useEffect(() => {
    setIsVisible(true)
    
    // Delay admin button appearance for smoother UX
    const delayTimer = setTimeout(() => {
      setShowAdminButton(true)
    }, 1000)
    
    return () => clearTimeout(delayTimer)
  }, [])
  useEffect(() => {
    setIsVisible(true)

    setAppState(getStepFromURL())

    const delayTimer = setTimeout(() => {
      setShowAdminButton(true)
    }, 1000)

    return () => clearTimeout(delayTimer)
  }, [])


  useEffect(() => {
    const currentStep = getStepFromURL()
    if (currentStep !== appState) {
      window.history.pushState({ step: appState }, '', `/?step=${appState}`)
    }
  }, [appState])


  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.step) {
        setAppState(event.state.step)
      } else {

        setAppState(getStepFromURL())
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  // Load available drivers from API endpoint
  useEffect(() => {
    async function loadDriverData() {
      try {
        setIsLoadingDrivers(true)
        const apiResponse = await fetch('/api/drivers')
        
        if (apiResponse.ok) {
          const driverData = await apiResponse.json()
          setAllDrivers(driverData)
          console.log(`Successfully loaded ${driverData.length} available drivers`) 
        } else {
          console.error('API call failed for drivers endpoint')
          setAllDrivers([])
        }
      } catch (err) {
        console.error('Error occurred while fetching driver data:', err)
        setAllDrivers([]) // Reset to empty state on error
      } finally {
        setIsLoadingDrivers(false)
      }
    }

    loadDriverData()
  }, [])

  const handleLocationSelect = (location: Location) => {
    setUserLocation(location)
    
    // Calculate nearest drivers based on user's location
    if (allDrivers.length > 0) {
      const nearbyDrivers = findClosestDrivers(
        { latitude: location.latitude, longitude: location.longitude },
        allDrivers,
        30 // Search radius of 30km - could be dynamic based on area density
      )
      setClosestDrivers(nearbyDrivers)
    } else {
      // No drivers available scenario
      setClosestDrivers([])
    }
    
    setAppState('driver-selection')
  }

  const handleSelectDriver = (driver: Driver) => {
    setSelectedDriver(driver)
    setAppState('assignment')
  }



  const handleAdminAccess = () => {
    router.push('/admin/login')
  }
  const handleGoBack = () => {
    window.history.back()
  }

 const handleNewRequest = () => {
  window.history.replaceState({ step: 'welcome' }, '', '/')
  setAppState('welcome')
  setUserLocation(null)
  setSelectedDriver(null)
  setClosestDrivers([])
} 
  // Render different content based on current application state
  const renderContent = () => {
    switch (appState) {
      case 'welcome':
        return (
          <div className="space-y-8 animate-slide-up">
            {/* Process explanation cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
              {[
                { step: 1, title: "Standort eingeben", desc: "Wo benötigen Sie Hilfe?", icon: MapPin },
                { step: 2, title: "Fahrer auswählen", desc: "Wählen Sie aus verfügbaren Partnern", icon: Car },
                { step: 3, title: "Hilfe-ID erhalten", desc: "Notieren Sie sich Ihre persönliche ID", icon: Shield },
                { step: 4, title: "Hotline anrufen", desc: "Geben Sie die ID durch - Hilfe kommt!", icon: Phone }
              ].map((processItem) => (
                <div key={processItem.step} className="text-center group">
                  <div className="w-16 h-16 road-sign rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <processItem.icon className="w-8 h-8 text-black" />
                  </div>
                  <div className="text-2xl font-black text-yellow-600 mb-2">{processItem.step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{processItem.title}</h3>
                  <p className="text-gray-600 text-sm">{processItem.desc}</p>
                </div>
              ))}
            </div>

            {/* Primary action button */}
            <div className="flex justify-center">
              <button
                onClick={() => setAppState('location-input')}
                className="group relative road-sign text-lg rounded-xl px-16 py-6 shadow-2xl transform transition-all duration-300 hover:scale-105 animate-pulse-gold"
              >
                <div className="absolute inset-0 rounded-xl bg-black opacity-5 group-hover:opacity-10 transition-opacity"></div>
                <span className="relative flex items-center justify-center text-lg">
                  <MapPin className="w-6 h-6 mr-3" />
                  JETZT HILFE ANFORDERN 
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
            
            {/* Service statistics display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="pro-card rounded-xl p-4 hover-lift">
                <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-bold text-lg">15-30min</span>
                </div>
                <p className="text-gray-600 text-sm text-center">Überall in Deutschland</p>
              </div>
              
              <div className="pro-card rounded-xl p-4 hover-lift">
                <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                  <Star className="w-5 h-5" />
                  <span className="font-bold text-lg">4.9/5</span>
                </div>
                <p className="text-gray-600 text-sm text-center">Kundenbewertung</p>
              </div>
              
              <div className="pro-card rounded-xl p-4 hover-lift">
                <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                  <Car className="w-5 h-5" />
                  <span className="font-bold text-lg">{allDrivers.length}+</span>
                </div>
                <p className="text-gray-600 text-sm text-center">Aktive Partner</p>
              </div>
            </div>
          </div>
        )

      case 'location-input':
        return (
          <div className="max-w-2xl mx-auto pro-card rounded-3xl p-8 shadow-xl transform hover-lift">
            <LocationInput 
              onBack={handleGoBack}
              onLocationSelect={handleLocationSelect}
            />
          </div>
        )

      case 'driver-selection':
        // Display loading spinner while driver data is being fetched
        if (isLoadingDrivers) {
          return (
            <div className="w-full max-w-2xl mx-auto pro-card rounded-3xl p-8 border-4 border-yellow-500">
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Lade verfügbare Fahrer</h3>
                <p className="text-gray-600">Bitte warten Sie einen Moment...</p>
              </div>
            </div>
          )
        }

        return (
          <div className="w-full">
            <DriverList 
              drivers={closestDrivers}
              selectedDriver={selectedDriver}
              onSelectDriver={handleSelectDriver}
              userLocation={userLocation!}
              onBack={handleGoBack}
            />
          </div>
        )

      case 'assignment':
        return (
          <div className="w-full">
            <DriverList 
              drivers={closestDrivers}
              selectedDriver={selectedDriver}
              onSelectDriver={handleSelectDriver}
              userLocation={userLocation!}
              onBack={handleGoBack}
            />
          </div>
        )
      
      default:
        return null 
    }
  }

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Road pattern background overlay */}
      <div className="absolute inset-0 road-pattern opacity-10"></div>
      
      {/* Animated floating decoration elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-4 h-4 bg-yellow-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-red-500 rounded-full animate-float opacity-40" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-yellow-400 rounded-full animate-float opacity-30" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Navigation buttons (Admin, Partners, Contact) - visible only on welcome */}
      {appState === 'welcome' && showAdminButton && (
        <div className="fixed top-4 right-4 z-50 animate-slide-up">
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAdminAccess}
              className="group flex items-center gap-2 pro-card border-2 border-gray-300 rounded-xl px-4 py-3 hover:border-yellow-500 transition-all duration-300 hover-lift"
              title="Admin Panel"
            >
              <Settings className="w-4 h-4 text-gray-600 group-hover:text-yellow-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-yellow-700 hidden sm:block">
                Admin
              </span>
            </button>
            
          </div>
        </div>
      )}

      <section className="relative z-10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className={`max-w-6xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 mb-8 warning-border animate-glow">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-700">
                Premium Pannenhilfe/Abschleppdienst
              </span>
            </div>
            
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span className="text-gray-900">
                  {appState === 'welcome' ? 'Pannenhilfe &' : 
                   appState === 'location-input' ? 'Standort' :
                   appState === 'driver-selection' ? 'Fahrer' : 'Hilfe ist unterwegs!'}
                </span>
                <br />
                <span className="text-yellow-600 animate-pulse">
                  {appState === 'welcome' ? 'Abschleppdienst' :
                   appState === 'location-input' ? 'eingeben' :
                   appState === 'driver-selection' ? 'auswählen' : 'ID bereitstellen'}
                </span>
              </h1>
              
              {appState === 'welcome' && (
                <div className="inline-block">
                  <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed pro-card rounded-2xl p-6 hover-lift">
                    <Zap className="w-6 h-6 text-yellow-600 inline mr-2 mb-1" />
                    24/7 Ganz Deutschland • Blitzschnell • Transparent • Professionell
                  </p>
                </div>
              )}
            </div>

            {renderContent()}
          </div>
        </div>
      </section>

      {appState === 'welcome' && (
        <FeaturesSection />
      )}
    </main>
  )
}

// Features showcase component - might consider extracting to separate file for better organization
function FeaturesSection() {
  // Service feature configuration data
  const serviceFeatures = [
    {
      icon: Clock,
      title: "Blitzschnelle Hilfe",
      desc: "Unsere Partner sind in 15-30 Minuten bei Ihnen - garantiert in ganz Deutschland",
      color: "from-yellow-500 to-yellow-400",
      delay: "0"
    },
    {
      icon: Shield,
      title: "Zertifizierte Profis", 
      desc: "Alle Partner sind geprüft, zertifiziert und versichert für maximale Sicherheit",
      color: "from-red-500 to-red-400",
      delay: "200"
    },
    {
      icon: Zap,
      title: "Moderne Technik",
      desc: "Echtzeit-Tracking, digitale Abwicklung und modernste Abschlepptechnik",
      color: "from-yellow-500 to-red-500", 
      delay: "400"
    }
  ]

  return (
    <section className="relative z-10 py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
            Warum uns wählen?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Premium Service für anspruchsvolle Kunden in ganz Deutschland
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {serviceFeatures.map((featureItem, idx) => (
            <div 
              key={idx}
              className="pro-card rounded-2xl p-8 hover-lift group"
              style={{ animationDelay: `${featureItem.delay}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${featureItem.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                <featureItem.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{featureItem.title}</h3>
              <p className="text-gray-600 text-center leading-relaxed">{featureItem.desc}</p>
              
              {/* Hover effect underline animation */}
              <div className="w-0 group-hover:w-full h-1 bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-500 mt-4 mx-auto rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Administrative access note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
            <Settings className="w-4 h-4" />
            <span>Administrator-Zugang verfügbar</span>
          </div>
        </div>
      </div>
    </section>
  )
}