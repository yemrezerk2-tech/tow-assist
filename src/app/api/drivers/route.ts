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

    // First filter: available and manuallyOnline drivers
    const filteredDrivers = (drivers || []).filter(driver =>
      driver.available == true && driver.manually_online == true
    )

    // Check each driver for active assignments
    const driversWithAssignmentCheck = await Promise.all(
      filteredDrivers.map(async (driver) => {
        try {
          // Check if this driver has any 'assigned' status assignments
          const { data: assignments, error: assignmentError } = await supabase
            .from('assignments')
            .select('id, status')
            .eq('driver_id', driver.id)
            .eq('status', 'assigned')
            .limit(1)

          if (assignmentError) {
            console.error(`Assignment check error for driver ${driver.id}:`, assignmentError)
            // On error, play safe - don't show the driver
            return {
              id: driver.id,
              name: driver.name,
              phone: driver.phone,
              latitude: driver.latitude,
              longitude: driver.longitude,
              description: driver.description,
              available: false,
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
              originalName: driver.original_name,
              _hasActiveAssignment: true,
              _error: assignmentError.message
            }
          }

          const hasActiveAssignment = assignments && assignments.length > 0
          const isActuallyAvailable = !hasActiveAssignment

          return {
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
            latitude: driver.latitude,
            longitude: driver.longitude,
            description: driver.description,
            available: driver.available && isActuallyAvailable,
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
            originalName: driver.original_name,
            _hasActiveAssignment: hasActiveAssignment
          }
        } catch (err) {
          console.error(`Error checking assignments for driver ${driver.id}:`, err)
          return {
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
            latitude: driver.latitude,
            longitude: driver.longitude,
            description: driver.description,
            available: false,
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
            originalName: driver.original_name,
            _hasActiveAssignment: true,
            _error: err instanceof Error ? err.message : 'Unknown error'
          }
        }
      })
    )

    const actuallyAvailableDrivers = driversWithAssignmentCheck.filter(
      driver => driver.available === true
    )

    console.log(`Driver filtering: Total ${drivers?.length || 0}, Available ${filteredDrivers.length}, Actually available ${actuallyAvailableDrivers.length}`)

    return NextResponse.json(actuallyAvailableDrivers)
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