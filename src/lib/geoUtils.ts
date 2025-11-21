import { Driver } from '@/types'

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const earthRadiusKm = 6371 
  
  const latDifference = degreesToRadians(point2.latitude - point1.latitude)
  const lonDifference = degreesToRadians(point2.longitude - point1.longitude)

  const a = 
    Math.sin(latDifference / 2) * Math.sin(latDifference / 2) +
    Math.cos(degreesToRadians(point1.latitude)) * Math.cos(degreesToRadians(point2.latitude)) * 
    Math.sin(lonDifference / 2) * Math.sin(lonDifference / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distanceInKm = earthRadiusKm * c

  const roundedDistance = Math.round(distanceInKm * 10) / 10  
  
  return roundedDistance
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function calculateEstimatedArrival(distanceKm: number): number {
  const avgSpeedKmh = 40   
  const preparationTimeMinutes = 5
  const travelTimeMinutes = (distanceKm / avgSpeedKmh) * 60
  const totalTimeMinutes = preparationTimeMinutes + travelTimeMinutes
  
  const finalEstimate = Math.max(10, Math.floor(totalTimeMinutes))
  console.log(`ETA calculation: ${distanceKm}km = ${finalEstimate} minutes (travel: ${Math.round(travelTimeMinutes)}min + prep: ${preparationTimeMinutes}min)`)
  
  return finalEstimate
}

/**
 * Find and rank drivers based on proximity and availability
 * Returns sorted list with closest available drivers first
 */
export function findClosestDrivers(userCoords: Coordinates, driversList: Driver[], maxRange: number = 50) {
  console.log(`=== DRIVER SEARCH ===`)
  console.log(`User location: ${userCoords.latitude}, ${userCoords.longitude}`)
  console.log(`Searching ${driversList.length} drivers within ${maxRange}km radius`)

  const driversWithCalculations = driversList
    .map(driverRecord => {
      const distanceToUser = calculateDistance(userCoords, {
        latitude: driverRecord.latitude,
        longitude: driverRecord.longitude
      })
      
      const eta = calculateEstimatedArrival(distanceToUser)
      
      return {
        ...driverRecord,
        distance: distanceToUser,
        estimatedArrival: eta,
        driverLocation: `${driverRecord.latitude}, ${driverRecord.longitude}`
      }
    })
    .filter(driverRecord => {
      const isCurrentlyAvailable = driverRecord.available && driverRecord.manuallyOnline
      const isWithinRange = driverRecord.distance <= maxRange
      const hasValidLocation = driverRecord.latitude && driverRecord.longitude

      console.log(`Driver: ${driverRecord.name}`)
      console.log(`  - Available: ${driverRecord.available}`)
      console.log(`  - Manually Online: ${driverRecord.manuallyOnline}`)
      console.log(`  - Distance: ${driverRecord.distance}km`)
      console.log(`  - In Range: ${isWithinRange}`)
      console.log(`  - Valid Location: ${hasValidLocation}`)
      console.log(`  - Final: ${isCurrentlyAvailable && isWithinRange && hasValidLocation ? 'INCLUDED' : 'EXCLUDED'}`)
      
      return isCurrentlyAvailable && isWithinRange && hasValidLocation
    })
    .sort((driverA, driverB) => {
      if (driverA.distance !== driverB.distance) {
        return driverA.distance - driverB.distance
      }
      return (driverB.rating || 0) - (driverA.rating || 0)
    })

  console.log(`Found ${driversWithCalculations.length} available drivers`)
  
  driversWithCalculations.slice(0, 3).forEach((driver, index) => {
    console.log(`${index + 1}. ${driver.name} - ${driver.distance}km - ETA: ${driver.estimatedArrival}min`)
  })
  
  return driversWithCalculations
}