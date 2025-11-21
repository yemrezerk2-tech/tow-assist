import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeDriverData, safeJsonParse } from '@/lib/sanitize'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('include_archived') === 'true'
    const archivedOnly = searchParams.get('archived_only') === 'true'

    let query = supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })

    if (archivedOnly) {
      query = query.eq('archived', true)
    } else if (!includeArchived) {
      query = query.eq('archived', false)
    }

    const { data: drivers, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    const processedDrivers = (drivers || []).map(driver => ({
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      latitude: driver.latitude,
      longitude: driver.longitude,
      description: driver.description,
      available: driver.available,
      manuallyOnline: driver.manually_online,
      serviceType: driver.service_type,
      workingHours: driver.working_hours,
      rating: driver.rating,
      vehicleType: driver.vehicle_type,
      basePrice: driver.base_price,
      serviceAreas: driver.service_areas || [],
      features: driver.features || [],
      maxDistance: driver.max_distance,
      responseTime: driver.response_time,
      archived: driver.archived || false,
      archivedAt: driver.archived_at,
      archivedReason: driver.archived_reason,
      originalName: driver.original_name
    }))

    return NextResponse.json(processedDrivers)
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const sanitizedData = sanitizeDriverData(data)
    
    let workingHours = sanitizedData.workingHours
    if (typeof workingHours === 'string') {
      workingHours = safeJsonParse(workingHours) || {
        mon: ["08:00", "20:00"],
        tue: ["08:00", "20:00"],
        wed: ["08:00", "20:00"],
        thu: ["08:00", "20:00"],
        fri: ["08:00", "20:00"],
        sat: ["09:00", "18:00"],
        sun: ["10:00", "16:00"]
      }
    }

    const newDriver = {
      id: `DRV${Date.now()}`,
      name: sanitizedData.name,
      phone: sanitizedData.phone,
      latitude: sanitizedData.latitude,
      longitude: sanitizedData.longitude,
      description: sanitizedData.description,
      vehicle_type: sanitizedData.vehicle_type,
      base_price: sanitizedData.base_price,
      available: sanitizedData.available !== undefined ? sanitizedData.available : true,
      rating: sanitizedData.rating || 4.5,
      service_areas: Array.isArray(sanitizedData.serviceAreas) ? sanitizedData.serviceAreas : [],
      features: Array.isArray(sanitizedData.features) ? sanitizedData.features : [],
      max_distance: sanitizedData.maxDistance || 50,
      response_time: sanitizedData.responseTime || 30,
      service_type: sanitizedData.serviceType || 'towing',
      manually_online: sanitizedData.manuallyOnline !== undefined ? sanitizedData.manuallyOnline : true,
      working_hours: workingHours,
      archived: false,
      archived_at: null,
      archived_reason: null
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .insert([newDriver])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    return NextResponse.json({ success: true, id: driver.id })
  } catch (error) {
    console.error('Error creating driver:', error)
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 })
  }
}