export interface Location {
  latitude: number
  longitude: number
  address: string
  accuracy?: number
}
export type WorkingHours = {
  [key: string]: string[] | '24/7'
} | '24/7'
export interface Driver {
  id: string
  name: string
  phone: string
  latitude: number
  longitude: number
  description: string
  available: boolean
  manuallyOnline: boolean 
  serviceType: 'towing' | 'repair' | 'both'
  workingHours: WorkingHours 
  rating: number
  vehicleType: string
  basePrice: number
  distance?: number
  estimatedArrival?: number
  serviceAreas?: string[]
  features?: string[]
  maxDistance?: number
  responseTime?: number
  
  archived?: boolean
  archivedAt?: string
  archivedReason?: string
  originalName?: string
}

export interface Assignment {
  id: string
  helpId: string  
  driverId: string
  userLocation: Location
  status: 'pending' | 'dispatched' | 'completed' | 'cancelled'
  createdAt: string
  userPhone?: string
  notes?: string
  driver?: Driver
}

export interface CallCenterConfig {
  phoneNumber: string
  businessHours: string
  emergencyOnly: boolean
}