'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Driver, Location } from '@/types'
import { Car, Navigation, MapPin, ZoomIn, ZoomOut } from 'lucide-react'

interface SimpleMapProps {
  userLocation: Location
  drivers: Driver[]
  selectedDriver: Driver | null
  onDriverSelect: (driver: Driver) => void
  height?: string
}

// Memoize styles outside component to prevent recreation
const CUSTOM_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke", 
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#fde047" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e0f2fe" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
]

export default function SimpleMap({ 
  userLocation, 
  drivers, 
  selectedDriver, 
  onDriverSelect, 
  height = '500px' 
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Use refs to track map objects
  const markersRef = useRef<google.maps.Marker[]>([])
  const circlesRef = useRef<google.maps.Circle[]>([])
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([])
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([])

  // Cleanup function - properly remove all map objects and listeners
  const cleanupMap = useCallback(() => {
    console.log('Cleaning up map resources...')
    
    // Remove all event listeners
    mapListenersRef.current.forEach(listener => {
      if (listener && listener.remove) {
        listener.remove()
      }
    })
    mapListenersRef.current = []
    
    // Clear all markers
    markersRef.current.forEach(marker => {
      if (marker) {
        google.maps.event.clearInstanceListeners(marker)
        marker.setMap(null)
      }
    })
    markersRef.current = []
    
    // Clear all circles
    circlesRef.current.forEach(circle => {
      if (circle) {
        circle.setMap(null)
      }
    })
    circlesRef.current = []
    
    // Close all info windows
    infoWindowsRef.current.forEach(window => {
      if (window) {
        window.close()
      }
    })
    infoWindowsRef.current = []
    
    // Clear map instance listeners
    if (googleMap) {
      google.maps.event.clearInstanceListeners(googleMap)
    }
  }, [googleMap])

  // Load Google Maps script
  const loadGoogleMaps = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Wait for existing script to load
        let attempts = 0
        const maxAttempts = 50 // 5 seconds max
        const checkInterval = setInterval(() => {
          attempts++
          if (window.google?.maps) {
            clearInterval(checkInterval)
            setGoogleMapsLoaded(true)
            resolve()
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval)
            reject(new Error('Timeout waiting for Google Maps to load'))
          }
        }, 100)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker,places`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        // Small delay to ensure everything is initialized
        setTimeout(() => {
          setGoogleMapsLoaded(true)
          resolve()
        }, 100)
      }
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'))
      }
      
      document.head.appendChild(script)
    })
  }, [])

  // Create map instance
  const createMapInstance = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) {
      console.error('Map container or Google Maps not available')
      return null
    }

    try {
      const mapOptions: google.maps.MapOptions = {
        zoom: 13,
        center: {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        },
        styles: CUSTOM_MAP_STYLES,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      }

      const map = new google.maps.Map(mapRef.current, mapOptions)
      
      // Force resize after a brief delay
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize')
        map.setCenter({
          lat: userLocation.latitude,
          lng: userLocation.longitude
        })
      }, 300)
      
      return map
    } catch (error) {
      console.error('Error creating map:', error)
      setErrorMsg('Failed to create map instance')
      return null
    }
  }, [userLocation.latitude, userLocation.longitude])

  // Single initialization effect
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return

      try {
        // Cleanup any existing map first
        cleanupMap()

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          const map = createMapInstance()
          setGoogleMap(map)
          return
        }

        // Load Google Maps
        await loadGoogleMaps()
        const map = createMapInstance()
        setGoogleMap(map)
        
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error)
        setErrorMsg('Failed to load Google Maps. Please refresh the page.')
      }
    }

    initMap()

    // Cleanup on unmount
    return () => {
      cleanupMap()
    }
  }, [cleanupMap, createMapInstance, loadGoogleMaps])

  // Update markers when drivers or selection changes
  useEffect(() => {
    if (!googleMap || !googleMapsLoaded) return

    console.log('🔄 Updating map markers...')

    // Clear existing markers and circles
    cleanupMap()

    // Add user location circle
    const userCircle = new google.maps.Circle({
      strokeColor: '#3B82F6',
      strokeOpacity: 0.4,
      strokeWeight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      map: googleMap,
      center: {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      },
      radius: 800
    })
    circlesRef.current.push(userCircle)

    // Add user location marker
    const userMarker = new google.maps.Marker({
      position: {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      },
      map: googleMap,
      title: 'Ihr Standort',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
    })
    markersRef.current.push(userMarker)

    // Add driver markers
    drivers.forEach((driver) => {
      if (!driver.available) return

      const isSelected = driver.id === selectedDriver?.id
      
      // Create driver marker
      const driverMarker = new google.maps.Marker({
        position: {
          lat: driver.latitude,
          lng: driver.longitude
        },
        map: googleMap,
        title: driver.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: isSelected ? '#10B981' : '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      })

      // Service area circle
      const serviceCircle = new google.maps.Circle({
        strokeColor: isSelected ? '#10B981' : '#EF4444',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: isSelected ? '#10B981' : '#EF4444',
        fillOpacity: 0.1,
        map: googleMap,
        center: {
          lat: driver.latitude,
          lng: driver.longitude
        },
        radius: 3000
      })

      // Info window content
      const infoWindowContent = `
        <div class="bg-white rounded-xl shadow-2xl border-2 ${isSelected ? 'border-green-500' : 'border-red-500'} max-w-xs">
          <div class="bg-gradient-to-r ${isSelected ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} p-4 rounded-t-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1v-4a1 1 0 00-.293-.707l-4-4A1 1 0 0016 4H3z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="font-bold text-white text-lg">${driver.name}</div>
                <div class="text-white text-opacity-90 text-sm">${driver.vehicleType}</div>
              </div>
              ${isSelected ? `
                <div class="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                  AUSGEWÄHLT
                </div>
              ` : ''}
            </div>
          </div>
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-gray-100 rounded-lg p-2">
                <div class="text-yellow-600 font-bold text-sm">${driver.rating}/5</div>
                <div class="text-gray-500 text-xs">Bewertung</div>
              </div>
              <div class="bg-gray-100 rounded-lg p-2">
                <div class="text-green-600 font-bold text-sm">${driver.distance}km</div>
                <div class="text-gray-500 text-xs">Entfernung</div>
              </div>
              <div class="bg-gray-100 rounded-lg p-2">
                <div class="text-blue-600 font-bold text-sm">${driver.estimatedArrival}min</div>
                <div class="text-gray-500 text-xs">Ankunft</div>
              </div>
            </div>
            <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-3 text-center">
              <div class="text-white font-bold text-lg">Ab ${driver.basePrice}€</div>
              <div class="text-yellow-100 text-sm">Festpreis inkl. Anfahrt</div>
            </div>
            <div class="text-gray-600 text-sm leading-relaxed">
              ${driver.description}
            </div>
            <button onclick="window.selectDriver('${driver.id}')" 
              class="w-full bg-gradient-to-r ${isSelected ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
              ${isSelected ? '✓ Ausgewählt' : 'Fahrer Auswählen'}
            </button>
          </div>
        </div>
      `

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
        maxWidth: 300
      })

      // Add click listener to marker
      const clickListener = driverMarker.addListener('click', () => {
        // Close all other info windows first
        infoWindowsRef.current.forEach(window => window.close())
        infoWindow.open(googleMap, driverMarker)
      })
      mapListenersRef.current.push(clickListener)

      markersRef.current.push(driverMarker)
      circlesRef.current.push(serviceCircle)
      infoWindowsRef.current.push(infoWindow)
    })

    console.log(`✅ Added ${markersRef.current.length - 1} driver markers`)

  }, [googleMap, googleMapsLoaded, drivers, selectedDriver, userLocation, cleanupMap])

  // Handle driver selection from info windows
  useEffect(() => {
    const handleDriverSelect = (driverId: string) => {
      const driver = drivers.find(d => d.id === driverId)
      if (driver) {
        onDriverSelect(driver)
        // Close all info windows after selection
        infoWindowsRef.current.forEach(window => window.close())
      }
    }

    // Store function on window for info window buttons
    window.selectDriver = handleDriverSelect

    return () => {
      // Clean up global function
      window.selectDriver = undefined as any
    }
  }, [drivers, onDriverSelect])

  // Map controls with useCallback to prevent recreation
  const recenterMap = useCallback(() => {
    if (googleMap) {
      googleMap.panTo({
        lat: userLocation.latitude,
        lng: userLocation.longitude
      })
    }
  }, [googleMap, userLocation.latitude, userLocation.longitude])

  const zoomIn = useCallback(() => {
    if (googleMap) {
      googleMap.setZoom((googleMap.getZoom() || 13) + 1)
    }
  }, [googleMap])

  const zoomOut = useCallback(() => {
    if (googleMap) {
      googleMap.setZoom((googleMap.getZoom() || 13) - 1)
    }
  }, [googleMap])

  // Error state
  if (errorMsg) {
    return (
      <div className="w-full bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center border-2 border-red-300 shadow-lg" style={{ height }}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-800 font-bold text-xl mb-2">Karte konnte nicht geladen werden</p>
          <p className="text-red-600 mb-4">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (!googleMapsLoaded) {
    return (
      <div className="w-full bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl flex items-center justify-center border-2 border-yellow-300 shadow-lg" style={{ height }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="w-6 h-6 text-yellow-600 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-700 font-semibold text-lg">Karte wird geladen...</p>
          <p className="text-gray-500 text-sm mt-2">Bereite Ihren Standort vor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full relative group">
      <div 
        ref={mapRef}
        className="w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-500 transition-all duration-300 group-hover:border-yellow-600"
        style={{ height, minHeight: '400px' }}
      />
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 shadow-lg">
        <button
          onClick={recenterMap}
          className="bg-white hover:bg-gray-50 rounded-xl p-3 border border-gray-300 hover:border-yellow-500 transition-all duration-200 transform hover:scale-105 group/btn"
          title="Zum Standort zentrieren"
        >
          <Navigation className="w-5 h-5 text-blue-600 group-hover/btn:text-blue-700 transition-colors" />
        </button>
        
        <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
          <button
            onClick={zoomIn}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors border-b border-gray-300"
            title="Vergrößern"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={zoomOut}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Verkleinern"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white text-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-300 backdrop-blur-sm">
        <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-yellow-600" />
          Legende
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow"></div>
            <span className="text-gray-700">Ihr Standort</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow"></div>
            <span className="text-gray-700">Verfügbare Fahrer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow"></div>
            <span className="text-gray-700">Ausgewählter Fahrer</span>
          </div>
        </div>
      </div>

      {/* Available drivers counter */}
      <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl px-4 py-2 shadow-lg border border-green-400">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>{drivers.filter(driver => driver.available).length} Fahrer verfügbar</span>
        </div>
      </div>
    </div>
  )
}