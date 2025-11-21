'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, Building, Navigation, Home, Map } from 'lucide-react'

interface AdminAddressInputProps {
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void
  initialAddress?: string
}

interface AutocompletePrediction {
  description: string
  place_id: string
  types: string[]
}

export default function AdminAddressInput({ onLocationSelect, initialAddress = '' }: AdminAddressInputProps) {
  const [enteredAddress, setEnteredAddress] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([])
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [googleMapsReady, setGoogleMapsReady] = useState(false)
  const [geocodingInProgress, setGeocodingInProgress] = useState(false)
  
  const inputFieldRef = useRef<HTMLInputElement>(null)
  const suggestionListRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocodingServiceRef = useRef<google.maps.Geocoder | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('Google Maps API key is missing - check your environment variables')
      return
    }

    const initializeGoogleMaps = () => {
      if (!window.google?.maps) {
        console.error('Google Maps JavaScript API is not loaded')
        return
      }

      try {
        if (!window.google.maps.places) {
          console.error('Google Places library not loaded - check the API setup')
          return
        }

        // Initialize the Google Maps services we need
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        geocodingServiceRef.current = new window.google.maps.Geocoder()
        setGoogleMapsReady(true)
        console.log('Google Maps services are ready to use')
      } catch (error) {
        console.error('Error setting up Google Maps services:', error)
      }
    }

    // Check if Google Maps is already available
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

    // Load Google Maps script
    const scriptElement = document.createElement('script')
    scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=de&region=DE`
    scriptElement.async = true
    scriptElement.defer = true
    
    scriptElement.onload = () => {
      // Give it a moment to fully initialize
      setTimeout(initializeGoogleMaps, 200)
    }

    scriptElement.onerror = () => {
      console.error('Failed to load Google Maps API')
    }

    document.head.appendChild(scriptElement)

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const clickedElement = event.target as Node
      if (suggestionListRef.current && !suggestionListRef.current.contains(clickedElement) &&
          inputFieldRef.current && !inputFieldRef.current.contains(clickedElement)) {
        setDropdownVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Get address suggestions when user types
  useEffect(() => {
    if (!enteredAddress.trim() || !autocompleteServiceRef.current) {
      setSuggestions([])
      setDropdownVisible(false)
      return
    }

    const searchDelay = setTimeout(() => {
      getAddressSuggestions(enteredAddress)
    }, 350) 

    return () => clearTimeout(searchDelay)
  }, [enteredAddress])

  const getAddressSuggestions = (searchQuery: string) => {
    if (!autocompleteServiceRef.current) {
      console.log('Autocomplete service is not ready yet')
      return
    }

    // Configure the search to focus on German locations
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: searchQuery,
        componentRestrictions: { country: 'de' },
        types: ['geocode', 'establishment'], // Include both addresses and businesses
        language: 'de',
        region: 'de'
      },
      (searchResults, responseStatus) => {
        if (responseStatus === window.google.maps.places.PlacesServiceStatus.OK && searchResults) {
          // Filter out results that are too general
          const relevantResults = searchResults
            .filter(result => {
              // Skip country-level or state-level results
              const isTooGeneral = result.types.includes('country') || 
                                  result.types.includes('administrative_area_level_1')
              return !isTooGeneral
            })
            .slice(0, 6) // Show max 6 suggestions 
          
          setSuggestions(relevantResults)
          setDropdownVisible(true)
        } else {
          console.log('No address suggestions found or API issue:', responseStatus)
          setSuggestions([])
          setDropdownVisible(false)
        }
      }
    )
  }

  const chooseSuggestion = (selectedSuggestion: AutocompletePrediction) => {
    setEnteredAddress(selectedSuggestion.description)
    setDropdownVisible(false)
    setGeocodingInProgress(true)

    // Convert the selected place to coordinates
    if (geocodingServiceRef.current) {
      geocodingServiceRef.current.geocode(
        { 
          placeId: selectedSuggestion.place_id,
          language: 'de'
        },
        (geoResults, geoStatus) => {
          setGeocodingInProgress(false)
          
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
            
            onLocationSelect({
              address: cleanAddress,
              latitude: position.lat(),
              longitude: position.lng()
            })
          } else {
            console.error('Failed to get coordinates:', geoStatus)
            // Use Hamburg city center as emergency fallback
            onLocationSelect({
              address: selectedSuggestion.description,
              latitude: 53.5511, // Hamburg center
              longitude: 9.9937
            })
          }
        }
      )
    } else {
      setGeocodingInProgress(false)
      console.error('Geocoding service is not available')
      // Emergency fallback with Hamburg coordinates
      onLocationSelect({
        address: selectedSuggestion.description,
        latitude: 53.5511,
        longitude: 9.9937
      })
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnteredAddress(e.target.value)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setDropdownVisible(true)
    }
  }

  // Choose appropriate icon based on place type
  const getLocationIcon = (placeTypes: string[]) => {
    if (placeTypes.includes('street_address') || placeTypes.includes('route')) {
      return <Home className="w-4 h-4 text-blue-500" />
    } else if (placeTypes.includes('establishment')) {
      return <Building className="w-4 h-4 text-green-500" />
    } else if (placeTypes.includes('locality')) {
      return <Map className="w-4 h-4 text-purple-500" />
    } else if (placeTypes.includes('postal_code')) {
      return <MapPin className="w-4 h-4 text-red-500" />
    } else {
      return <Navigation className="w-4 h-4 text-gray-500" />
    }
  }

  // Create human-readable type labels
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

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputFieldRef}
          type="text"
          value={enteredAddress}
          onChange={handleAddressChange}
          onFocus={handleInputFocus}
          placeholder="Straße, Adresse, Gebäude oder Ort eingeben..."
          className="w-full pl-11 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300 text-sm"
          disabled={!googleMapsReady}
        />
        
        {geocodingInProgress && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {dropdownVisible && suggestions.length > 0 && (
        <div 
          ref={suggestionListRef}
          className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border-2 border-yellow-500 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.place_id}-${index}`} // More robust key
              onClick={() => chooseSuggestion(suggestion)}
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

      {/* Status indicators */}
      {!googleMapsReady && (
        <div className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
          <div className="w-3 h-3 border border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          Lade Google Maps Dienste...
        </div>
      )}

      {/* User guidance */}
      <div className="text-xs text-gray-500 mt-2">
        Bitte geben Sie eine vollständige Adresse oder bekannten Ort ein
      </div>
      
      {/* Debug info - would probably remove this in production */}
      {suggestions.length === 0 && enteredAddress.length > 2 && googleMapsReady && (
        <div className="text-xs text-gray-400 mt-1">
          Keine Vorschläge gefunden - versuchen Sie eine andere Schreibweise
        </div>
      )}
    </div>
  )
}