export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

export function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return sanitizeInput(value)
  } else if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item))
  } else if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value)
  }
  return value
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj
  
  const sanitized = { ...obj } as T
  
  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      sanitized[key] = sanitizeValue(sanitized[key]) as T[Extract<keyof T, string>]
    }
  }
  
  return sanitized
}

interface DriverData {
  latitude?: number | string;
  longitude?: number | string;
  base_price?: number | string;
  rating?: number | string;
  max_distance?: number | string;
  response_time?: number | string;
  [key: string]: any;
}

interface LocationData {
  latitude?: number | string;
  longitude?: number | string;
  [key: string]: any;
}

export function sanitizeDriverData<T extends DriverData>(data: T): T {
  const sanitized = sanitizeObject(data)
  
  if ('latitude' in sanitized && sanitized.latitude !== undefined) {
    sanitized.latitude = typeof data.latitude === 'number' ? data.latitude : parseFloat(String(data.latitude)) || 0
  }
  if ('longitude' in sanitized && sanitized.longitude !== undefined) {
    sanitized.longitude = typeof data.longitude === 'number' ? data.longitude : parseFloat(String(data.longitude)) || 0
  }
  if ('base_price' in sanitized && sanitized.base_price !== undefined) {
    sanitized.base_price = typeof data.base_price === 'number' ? data.base_price : parseInt(String(data.base_price)) || 0
  }
  if ('rating' in sanitized && sanitized.rating !== undefined) {
    sanitized.rating = typeof data.rating === 'number' ? data.rating : parseFloat(String(data.rating)) || 4.5
  }
  if ('max_distance' in sanitized && sanitized.max_distance !== undefined) {
    sanitized.max_distance = typeof data.max_distance === 'number' ? data.max_distance : parseInt(String(data.max_distance)) || 50
  }
  if ('response_time' in sanitized && sanitized.response_time !== undefined) {
    sanitized.response_time = typeof data.response_time === 'number' ? data.response_time : parseInt(String(data.response_time)) || 30
  }
  
  return sanitized
}

export function sanitizeLocationData<T extends LocationData>(data: T): T {
  const sanitized = sanitizeObject(data)

  if ('latitude' in sanitized && sanitized.latitude !== undefined) {
    sanitized.latitude = typeof data.latitude === 'number' ? data.latitude : parseFloat(String(data.latitude)) || 0
  }
  if ('longitude' in sanitized && sanitized.longitude !== undefined) {
    sanitized.longitude = typeof data.longitude === 'number' ? data.longitude : parseFloat(String(data.longitude)) || 0
  }
  
  return sanitized
}

export function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}