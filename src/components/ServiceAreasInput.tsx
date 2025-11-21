'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Plus, X, Search } from 'lucide-react'

// I prefer to keep interfaces simple and straightforward
interface ServiceAreasInputProps {
  value: string[]
  onChange: (areas: string[]) => void
  placeholder?: string
}

interface AutocompletePrediction {
  description: string
  place_id: string
}

export default function ServiceAreasInput({ 
  value, 
  onChange, 
  placeholder = "Servicegebiet hinzufügen..." 
}: ServiceAreasInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)  // renamed for clarity
  
  // keeping references organized
  const inputRef = useRef<HTMLInputElement>(null)
  const predictionsRef = useRef<HTMLDivElement>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null) // not used but keeping it just in case

  // TODO: maybe split this massive effect into smaller functions later
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.error('Google Maps API key not configured')
      return
    }

    // helper function to initialize Google Maps services
    const setupGoogleServices = () => {
      if (!window.google?.maps) {
        console.error('Google Maps not available')
        return
      }

      try {
        if (!window.google.maps.places) {
          console.error('Google Maps Places library not loaded')
          return
        }

        autocompleteService.current = new window.google.maps.places.AutocompleteService()
        geocoder.current = new window.google.maps.Geocoder()
        setIsGoogleLoaded(true)
        console.log('Google Maps services initialized successfully') // debug info
      } catch (error) {
        console.error('Error initializing Google Maps services:', error)
      }
    }

    // check if already loaded
    if (window.google?.maps?.places) {
      setupGoogleServices()
      return
    }

    // look for existing script tag - avoid duplicate loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // wait for it to load
      let attempts = 0
      const maxAttempts = 50 // 5 seconds max
      const checkInterval = setInterval(() => {
        attempts++
        if (window.google?.maps?.places) {
          setupGoogleServices()
          clearInterval(checkInterval)
        } else if (attempts >= maxAttempts) {
          console.error('Google Maps failed to load after 5 seconds')
          clearInterval(checkInterval)
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    // create and load the script
    const googleScript = document.createElement('script')
    googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=de&region=DE`
    googleScript.async = true
    googleScript.defer = true
    
    googleScript.onload = () => {
      // small delay to ensure everything is ready
      setTimeout(setupGoogleServices, 150)
    }

    googleScript.onerror = () => {
      console.error('Failed to load Google Maps script')
    }

    document.head.appendChild(googleScript)

    // handle clicking outside to close predictions
    const handleOutsideClick = (event: MouseEvent) => {
      const clickedElement = event.target as Node
      const isOutsidePredictions = predictionsRef.current && !predictionsRef.current.contains(clickedElement)
      const isOutsideInput = inputRef.current && !inputRef.current.contains(clickedElement)
      
      if (isOutsidePredictions && isOutsideInput) {
        setShowPredictions(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, []) // empty dependency array is fine here

  // debounced search for predictions
  useEffect(() => {
    if (!inputValue.trim() || !autocompleteService.current) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    // debounce the API calls - 300ms seems reasonable
    const searchTimer = setTimeout(() => {
      fetchPlacePredictions(inputValue)
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [inputValue])

  const fetchPlacePredictions = (searchInput: string) => {
    if (!autocompleteService.current) {
      console.warn('Autocomplete service not available')
      return
    }

    const searchRequest = {
      input: searchInput,
      componentRestrictions: { country: 'de' },
      types: ['locality', 'administrative_area_level_3'],
      language: 'de',
      region: 'de'
    }

    autocompleteService.current.getPlacePredictions(
      searchRequest,
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          // limit to 5 results for better UX
          const limitedResults = results.slice(0, 5)
          setPredictions(limitedResults)
          setShowPredictions(true)
        } else {
          setPredictions([])
          setShowPredictions(false)
          // maybe log the status for debugging
          if (status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.warn('Places API request failed:', status)
          }
        }
      }
    )
  }

  const selectPrediction = (selectedPrediction: AutocompletePrediction) => {
    // avoid duplicates
    if (!value.includes(selectedPrediction.description)) {
      const updatedAreas = [...value, selectedPrediction.description]
      onChange(updatedAreas)
    }
    
    // reset input state
    setInputValue('')
    setShowPredictions(false)
    
    // refocus input for better UX
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const deleteArea = (targetArea: string) => {
    const filteredAreas = value.filter(area => area !== targetArea)
    onChange(filteredAreas)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const onInputFocus = () => {
    // show predictions if we have some
    if (predictions.length > 0) {
      setShowPredictions(true)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const trimmedInput = inputValue.trim()
      
      // check for duplicates before adding
      if (!value.includes(trimmedInput)) {
        const newAreasList = [...value, trimmedInput]
        onChange(newAreasList)
      }
      setInputValue('')
      setShowPredictions(false)
    }
  }

  const addCurrentInput = () => {
    const trimmedInput = inputValue.trim()
    if (trimmedInput && !value.includes(trimmedInput)) {
      const newAreasList = [...value, trimmedInput]
      onChange(newAreasList)
      setInputValue('')
      setShowPredictions(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Display existing service areas */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((serviceArea, idx) => (
            <span
              key={`area-${idx}`} // using index is fine for this use case
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              <MapPin className="w-3 h-3" />
              {serviceArea}
              <button
                type="button"
                onClick={() => deleteArea(serviceArea)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-200"
                aria-label={`Remove ${serviceArea}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input section */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={onInputChange}
              onFocus={onInputFocus}
              onKeyDown={onKeyDown} // changed from onKeyPress for better compatibility
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300 outline-none"
              disabled={!isGoogleLoaded}
            />

            {/* Predictions dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div 
                ref={predictionsRef}
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border-2 border-yellow-500 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
              >
                {predictions.map((prediction, index) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    onClick={() => selectPrediction(prediction)}
                    className="w-full px-4 py-3 text-left hover:bg-yellow-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 focus:bg-yellow-50 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-gray-900 text-sm font-medium">
                        {prediction.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Add button */}
          <button
            type="button"
            onClick={addCurrentInput}
            disabled={!inputValue.trim() || !isGoogleLoaded}
            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Hinzufügen
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500 mt-2">
          Geben Sie eine Stadt oder einen Ort ein und wählen Sie aus den Vorschlägen, oder drücken Sie Enter zum Hinzufügen
        </p>

        {/* Loading indicator */}
        {!isGoogleLoaded && (
          <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            Google Maps wird geladen...
          </div>
        )}
      </div>
    </div>
  )
}