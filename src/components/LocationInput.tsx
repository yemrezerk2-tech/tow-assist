'use client'

import { useState, useEffect, useRef } from 'react'
import { Location } from '@/types'
import { Navigation, ArrowLeft, Satellite, Crosshair, Search, MapPin, Building, Home, Info } from 'lucide-react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

interface LocationInputProps {
  onBack: () => void
  onLocationSelect?: (location: Location) => void
}

interface AutocompletePrediction {
  description: string
  place_id: string
  types: string[]
}

export default function LocationInput({ onBack, onLocationSelect }: LocationInputProps) {
  const [inputAddress, setInputAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [findingCurrentLocation, setFindingCurrentLocation] = useState(false)
  const [showMapView, setShowMapView] = useState(false)
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([])
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [googleMapsReady, setGoogleMapsReady] = useState(false)
  
  const inputFieldRef = useRef<HTMLInputElement>(null)
  const suggestionListRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocodingServiceRef = useRef<google.maps.Geocoder | null>(null)

  const { isLoaded: mapsApiReady } = useGoogleMaps()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  useEffect(() => {
    const initializeGoogleMaps = () => {
      if (!window.google?.maps) {
        console.error('Google Maps JavaScript API is not loaded')
        return
      }

      try {
        if (!window.google.maps.places) {
          console.error('Google Places library not loaded')
          return
        }

        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        geocodingServiceRef.current = new window.google.maps.Geocoder()
        setGoogleMapsReady(true)
      } catch (error) {
        console.error('Error setting up Google Maps services:', error)
      }
    }

    if (window.google?.maps?.places) {
      initializeGoogleMaps()
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          initializeGoogleMaps()
          clearInterval(checkInterval)
        }
      }, 150)
      return () => clearInterval(checkInterval)
    }
  }, [])

  useEffect(() => {
    if (!inputAddress.trim() || !autocompleteServiceRef.current) {
      setSuggestions([])
      setDropdownVisible(false)
      return
    }

    const searchDelay = setTimeout(() => {
      getAddressSuggestions(inputAddress)
    }, 300)

    return () => clearTimeout(searchDelay)
  }, [inputAddress])

  const getAddressSuggestions = (searchQuery: string) => {
    if (!autocompleteServiceRef.current) return

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: searchQuery,
        componentRestrictions: { country: 'de' },
        types: ['geocode', 'establishment'],
        language: 'de',
        region: 'de'
      },
      (searchResults, responseStatus) => {
        if (responseStatus === window.google.maps.places.PlacesServiceStatus.OK && searchResults) {
          const relevantResults = searchResults
            .filter(result => {
              const isTooGeneral = result.types.includes('country') || 
                                  result.types.includes('administrative_area_level_1')
              return !isTooGeneral
            })
            .slice(0, 6)
          
          setSuggestions(relevantResults)
          setDropdownVisible(true)
        } else {
          setSuggestions([])
          setDropdownVisible(false)
        }
      }
    )
  }

  const selectSuggestion = (selectedSuggestion: AutocompletePrediction) => {
    setInputAddress(selectedSuggestion.description)
    setDropdownVisible(false)
    setIsSearching(true)

    if (geocodingServiceRef.current) {
      geocodingServiceRef.current.geocode(
        { 
          placeId: selectedSuggestion.place_id,
          language: 'de'
        },
        (geoResults, geoStatus) => {
          setIsSearching(false)
          
          if (geoStatus === 'OK' && geoResults?.[0]) {
            const position = geoResults[0].geometry.location
            const addressParts = geoResults[0].address_components
            
            let cleanAddress = selectedSuggestion.description
            if (selectedSuggestion.types.includes('establishment') && addressParts) {
              const streetNum = addressParts.find(part => part.types.includes('street_number'))
              const streetName = addressParts.find(part => part.types.includes('route'))
              const city = addressParts.find(part => part.types.includes('locality'))
              
              if (streetNum && streetName) {
                cleanAddress = `${streetName.long_name} ${streetNum.long_name}`
                if (city) {
                  cleanAddress += `, ${city.long_name}`
                }
              }
            }
            
            onLocationSelect?.({
              address: cleanAddress,
              latitude: position.lat(),
              longitude: position.lng()
            })
          } else {
            onLocationSelect?.({
              address: selectedSuggestion.description,
              latitude: 53.5511,
              longitude: 9.9937
            })
          }
        }
      )
    } else {
      setIsSearching(false)
      onLocationSelect?.({
        address: selectedSuggestion.description,
        latitude: 53.5511,
        longitude: 9.9937
      })
    }
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setDropdownVisible(true)
    }
  }

  const getLocationIcon = (placeTypes: string[]) => {
    if (placeTypes.includes('street_address') || placeTypes.includes('route')) {
      return <Home className="w-4 h-4 text-blue-500" />
    } else if (placeTypes.includes('establishment')) {
      return <Building className="w-4 h-4 text-green-500" />
    } else if (placeTypes.includes('locality')) {
      return <MapPin className="w-4 h-4 text-purple-500" />
    } else {
      return <Navigation className="w-4 h-4 text-gray-500" />
    }
  }

  const getLocationTypeText = (placeTypes: string[]) => {
    if (placeTypes.includes('street_address')) {
      return 'Hausadresse'
    } else if (placeTypes.includes('establishment')) {
      return 'Geschäft/Ort'
    } else if (placeTypes.includes('locality')) {
      return 'Stadtgebiet'
    } else if (placeTypes.includes('postal_code')) {
      return 'PLZ-Bereich'
    } else if (placeTypes.includes('route')) {
      return 'Straßenname'
    } else {
      return 'Standort'
    }
  }

  const detectCurrentLocation = () => {
    setIsSearching(true)
    setFindingCurrentLocation(true)

    if (!navigator.geolocation) {
      alert('Ihr Browser unterstützt keine Standortermittlung.')
      setIsSearching(false)
      setFindingCurrentLocation(false)
      return
    }

    const locationSettings = {
      enableHighAccuracy: true,
      timeout: 18000, 
      maximumAge: 30000 
    }

    navigator.geolocation.getCurrentPosition(
      async (positionData) => {
        const { latitude, longitude } = positionData.coords
        
        let addressText = `Meine Position (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`
        
        try {
          if (window.google?.maps) {
            const geocoderInstance = new google.maps.Geocoder();
            try {
              const geocodeResults = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoderInstance.geocode(
                  { location: { lat: latitude, lng: longitude } },
                  (results, status) => {
                    if (status === 'OK' && results?.[0]) {
                      resolve(results)
                    } else {
                      reject(new Error(`Reverse geocoding error: ${status}`))
                    }
                  }
                )
              })
              
              if (geocodeResults?.[0]) {
                addressText = geocodeResults[0].formatted_address
              }
            } catch (geoError) {
              // Keep using coordinate-based address
            }
          }
          
          const detectedLocation: Location = {
            latitude,
            longitude,
            address: addressText
          }
          
          onLocationSelect?.(detectedLocation)
          
        } catch (locationProcessingError) {
          const backupLocation: Location = {
            latitude,
            longitude,
            address: addressText
          }
          onLocationSelect?.(backupLocation)
        } finally {
          setIsSearching(false)
          setFindingCurrentLocation(false)
        }
      },
      (geoError) => {
        let errorMessage = 'Standort konnte nicht gefunden werden.'
        
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = 'Standortzugriff wurde blockiert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen und versuchen Sie es erneut.'
            break
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = 'Standort ist momentan nicht verfügbar. Prüfen Sie Ihre Internetverbindung und GPS-Einstellungen.'
            break
          case geoError.TIMEOUT:
            errorMessage = 'Die Standortermittlung hat zu lange gedauert. Versuchen Sie es nochmal oder geben Sie eine Adresse manuell ein.'
            break
        }
        
        alert(errorMessage)
        setIsSearching(false)
        setFindingCurrentLocation(false)
      },
      locationSettings
    )
  }

  const searchForAddress = async () => {
    if (!inputAddress.trim()) return

    setIsSearching(true)
    
    try {
      if (window.google?.maps) {
        const geocoderInstance = new google.maps.Geocoder();
        const geocodeResults = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoderInstance.geocode(
            { 
              address: inputAddress,
              componentRestrictions: { country: 'DE' },
              language: 'de'
            },
            (results, status) => {
              if (status === 'OK' && results?.[0]) {
                resolve(results)
              } else {
                reject(new Error(`Address geocoding failed: ${status}`))
              }
            }
          )
        })

        if (geocodeResults?.[0]) {
          const foundPosition = geocodeResults[0].geometry.location
          const foundLocation: Location = {
            latitude: foundPosition.lat(),
            longitude: foundPosition.lng(),
            address: geocodeResults[0].formatted_address
          }
          onLocationSelect?.(foundLocation)
          return
        }
      }

      const hamburgFallback: Location = {
        latitude: 53.5505,
        longitude: 9.9937,
        address: inputAddress
      }
      onLocationSelect?.(hamburgFallback)
      
    } catch (addressSearchError) {
      const errorFallback: Location = {
        latitude: 53.5505,
        longitude: 9.9937,
        address: inputAddress
      }
      onLocationSelect?.(errorFallback)
    } finally {
      setIsSearching(false)
    }
  }

  // Show map picker when requested
  if (showMapView) {
    return (
      <InteractiveMapPicker 
        onLocationSelect={(selectedLocation) => {
          setInputAddress(selectedLocation.address)
          onLocationSelect?.(selectedLocation)
          setShowMapView(false)
        }}
        onCancel={() => setShowMapView(false)}
      />
    )
  }

  // Main location input interface
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={onBack}
          className="p-3 pro-card rounded-xl hover:border-yellow-500 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-black text-gray-900">
            Wo benötigen Sie Hilfe?
          </h2>
          <p className="text-gray-600 mt-2">Teilen Sie uns Ihren Standort mit für die schnellste Hilfe</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Address input section with predictive search */}
        <div className="relative">
          <div className="flex gap-4 relative">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-600 w-5 h-5" />
              <input
                ref={inputFieldRef}
                type="text"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                onFocus={handleInputFocus}
                onKeyPress={(e) => e.key === 'Enter' && searchForAddress()}
                placeholder="Straße, Adresse, Gebäude oder Ort eingeben..."
                className="flex h-16 w-full rounded-xl border-2 border-gray-300 bg-white px-14 py-4 text-lg placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 text-gray-900 transition-all duration-300"
                disabled={!googleMapsReady}
              />
              
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <button
              onClick={searchForAddress}
              disabled={isSearching || !inputAddress.trim()}
              className="hidden md:inline-flex items-center justify-center rounded-xl road-sign px-10 py-4 font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Suchen'
              )}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {dropdownVisible && suggestions.length > 0 && (
            <div 
              ref={suggestionListRef}
              className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border-2 border-yellow-500 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.place_id}-${index}`}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-5 py-4 text-left hover:bg-yellow-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                      {getLocationIcon(suggestion.types)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 text-sm font-medium truncate group-hover:text-gray-700">
                        {suggestion.description}
                      </div>
                      <div className="text-gray-500 text-xs mt-1.5">
                        <span className="bg-gray-100 group-hover:bg-yellow-100 px-2 py-1 rounded-full transition-colors">
                          {getLocationTypeText(suggestion.types)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!googleMapsReady && (
            <div className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
              <div className="w-3 h-3 border border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              Lade Google Maps Dienste...
            </div>
          )}
        </div>
      {/* Intermediary notice */}
      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Hinweis:</span> Wir sind eine Vermittlungsplattform. Sie wählen einen Fahrer aus, erhalten eine Hilfe-ID und rufen unser Callcenter an. Wir verbinden Sie dann direkt mit dem ausgewählten Fahrer.
        </p>
      </div>
        {/* Rest of the component remains the same */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-6 py-2 rounded-lg text-gray-500 font-medium">oder wählen Sie eine Option</span>
          </div>
        </div>

        {/* Location method buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={detectCurrentLocation}
            disabled={isSearching}
            className="group relative pro-card rounded-xl p-8 border-2 border-gray-300 hover:border-yellow-500 transition-all duration-500 hover-lift disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${findingCurrentLocation ? 'animate-pulse' : ''}`}>
                <Crosshair className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-lg">Aktuellen Standort nutzen</div>
                <div className="text-sm text-gray-600">GPS-Position automatisch ermitteln</div>
              </div>
            </div>
            
            {findingCurrentLocation && (
              <div className="absolute inset-0 rounded-xl bg-yellow-500/10 animate-pulse"></div>
            )}
          </button>

          <button
            onClick={() => setShowMapView(true)}
            disabled={!mapsApiReady}
            className="group pro-card rounded-xl p-8 border-2 border-gray-300 hover:border-red-500 transition-all duration-500 hover-lift disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Satellite className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-lg">Interaktive Karte</div>
                <div className="text-sm text-gray-600">Position auf der Karte wählen</div>
                {!mapsApiReady && (
                  <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                    Karte lädt...
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Active search indicator */}
        {isSearching && (
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-4 pro-card rounded-2xl px-8 py-6 border-2 border-yellow-500">
              <div className="w-7 h-7 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="font-bold text-yellow-700 text-lg">
                  {findingCurrentLocation ? 'Ermittle Ihren Standort' : 'Suche Adresse'}
                </p>
                <p className="text-gray-600 text-sm">Einen Moment bitte...</p>
              </div>
            </div>
          </div>
        )}

        {/* Feature showcase cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="pro-card rounded-xl p-6 text-center hover-lift group">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div className="text-yellow-700 font-bold text-sm">Intelligente Suche</div>
            <div className="text-gray-600 text-xs leading-relaxed">Automatische Adressvorschläge</div>
          </div>
          
          <div className="pro-card rounded-xl p-6 text-center hover-lift group">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div className="text-orange-600 font-bold text-sm">Präzise Ortung</div>
            <div className="text-gray-600 text-xs leading-relaxed">GPS-basierte Standortfindung</div>
          </div>
          
          <div className="pro-card rounded-xl p-6 text-center hover-lift group">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Satellite className="w-5 h-5 text-white" />
            </div>
            <div className="text-red-700 font-bold text-sm">Visual Selection</div>
            <div className="text-gray-600 text-xs leading-relaxed">Punkt-und-Klick Auswahl</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Map-based location picker 
function InteractiveMapPicker({ onLocationSelect, onCancel }: { 
  onLocationSelect: (location: Location) => void; 
  onCancel: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [, setMapInstance] = useState<google.maps.Map | null>(null)
  const currentMarkerRef = useRef<google.maps.Marker | null>(null)
  const [markerIsPlaced, setMarkerIsPlaced] = useState(false)
  const { isLoaded: googleReady } = useGoogleMaps()

  useEffect(() => {
    if (!googleReady || !mapContainerRef.current) return

    const mapConfiguration: google.maps.MapOptions = {
      zoom: 13, 
      center: { lat: 53.5511, lng: 9.9937 }, // Hamburg center
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      gestureHandling: 'greedy' // Makes mobile interaction easier
    }

    const newMapInstance = new google.maps.Map(mapContainerRef.current, mapConfiguration)
    setMapInstance(newMapInstance)

    // Handle map clicks
    const mapClickHandler = newMapInstance.addListener('click', (clickEvent: google.maps.MapMouseEvent) => {
      if (!clickEvent.latLng) return

      // Clean up existing marker
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null)
      }

      // Create new marker at clicked position
      const newLocationMarker = new google.maps.Marker({
        position: clickEvent.latLng,
        map: newMapInstance,
        draggable: true,
        title: 'Ihr ausgewählter Standort',
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EAB308', 
          fillOpacity: 1,
          strokeColor: '#CA8A04',
          strokeWeight: 2,
        }
      })

      currentMarkerRef.current = newLocationMarker
      setMarkerIsPlaced(true)
      
      // Handle marker dragging
      newLocationMarker.addListener('dragend', () => {
        console.log('User dragged the marker to new position')
        // Marker is still there after dragging
      })

      // Show temporary info popup
      const coordinateInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3 text-sm">
            <strong>Standort gewählt</strong><br>
            <span class="text-gray-600">
              ${clickEvent.latLng.lat().toFixed(4)}, ${clickEvent.latLng.lng().toFixed(4)}
            </span><br>
            <small class="text-gray-500">Sie können den Marker noch verschieben</small>
          </div>
        `,
      })
      
      coordinateInfoWindow.open(newMapInstance, newLocationMarker)
      
      // Auto-close the popup after a few seconds
      setTimeout(() => {
        coordinateInfoWindow.close()
      }, 3000)
    })

    return () => {
      google.maps.event.removeListener(mapClickHandler)
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null)
      }
    }
  }, [googleReady])

  const confirmSelectedLocation = () => {
    if (!currentMarkerRef.current) {
      alert('Bitte klicken Sie zuerst auf die Karte, um einen Standort zu markieren.')
      return
    }

    const markerPosition = currentMarkerRef.current.getPosition()
    if (!markerPosition) return

    const confirmedLocation: Location = {
      latitude: markerPosition.lat(),
      longitude: markerPosition.lng(),
      address: `Kartenposition (${markerPosition.lat().toFixed(4)}, ${markerPosition.lng().toFixed(4)})`
    }

    console.log('User confirmed map location:', confirmedLocation)
    onLocationSelect(confirmedLocation)
  }

  const removeCurrentMarker = () => {
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null)
      currentMarkerRef.current = null
      setMarkerIsPlaced(false)
    }
  }

  if (!googleReady) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onCancel} className="p-3 pro-card rounded-xl hover:border-yellow-500 transition-all duration-300 group">
            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-gray-900">Karte wird vorbereitet...</h2>
          </div>
        </div>
        <div className="pro-card rounded-2xl p-8 border-4 border-yellow-500">
          <div className="text-center py-16">
            <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">Google Maps wird geladen, bitte warten...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="p-3 pro-card rounded-xl hover:border-yellow-500 transition-all duration-300 group">
          <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-black text-gray-900">Standort auf der Karte wählen</h2>
          <p className="text-gray-600 mt-1">Klicken Sie auf Ihren gewünschten Standort</p>
        </div>
      </div>

      <div className="pro-card rounded-2xl p-8 border-4 border-yellow-500">
        <div 
          ref={mapContainerRef}
          className="w-full h-[28rem] rounded-xl overflow-hidden border-2 border-gray-300 bg-gray-100"
        />
        
        {/* Instructions panel */}
        <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-3">💡 Bedienung der Karte</h3>
          <div className="space-y-2 text-blue-700 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-yellow-600"></div>
              <span><strong>Klicken:</strong> Marker an dieser Stelle platzieren</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span><strong>Ziehen:</strong> Marker zur gewünschten Position bewegen</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span><strong>Zoom:</strong> Mausrad oder + / - Buttons verwenden</span>
            </div>
          </div>
          
          {markerIsPlaced && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
              <p className="text-green-800 text-sm font-medium">✓ Standort markiert! Sie können jetzt fortfahren oder die Position noch anpassen.</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={confirmSelectedLocation}
            disabled={!markerIsPlaced}
            className="flex-1 road-sign py-4 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
          >
            {markerIsPlaced ? "✓ Diesen Standort verwenden" : "Zuerst Standort auf Karte wählen"}
          </button>
          
          <button
            onClick={removeCurrentMarker}
            disabled={!markerIsPlaced}
            className="flex-1 pro-card border-2 border-gray-300 py-4 font-semibold text-gray-700 rounded-xl hover:border-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑️ Marker entfernen
          </button>
        </div>
      </div>
    </div>
  )
}