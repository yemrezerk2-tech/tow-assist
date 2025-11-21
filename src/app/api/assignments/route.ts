import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeObject, sanitizeLocationData } from '@/lib/sanitize'

/**
 * ASSIGNMENT MANAGEMENT API - IMPORTANT FOR TWILIO DEV
 * 
 * Handles assignment creation and retrieval for our call center system.
 * Call center operators can use this to track and manage driver assignments.
 * Also provides lookup functionality by helpId for customer service.
 */

// Status workflow for assignments (important for call center training):
// pending → customer is waiting for initial contact from call center
// assigned → driver has been notified and is heading to location  
// completed → service has been successfully completed
// cancelled → customer cancelled or we couldn't fulfill the request

export async function POST(request: Request) {
  try {
    const requestBody = await request.json()
    
    // Sanitize all input data
    const sanitizedData = sanitizeObject(requestBody)
    
    // Special handling for location data
    if (sanitizedData.userLocation) {
      sanitizedData.userLocation = sanitizeLocationData(sanitizedData.userLocation)
    }
    
    console.log('=== CREATING NEW ASSIGNMENT ===')
    console.log('Assignment ID:', sanitizedData.assignmentId)
    console.log('Help Request ID:', sanitizedData.helpId)
    console.log('Driver ID:', sanitizedData.driverId)
    
    // Build assignment record
    const assignmentData = {
      id: sanitizedData.assignmentId,
      help_id: sanitizedData.helpId,
      driver_id: sanitizedData.driverId,
      user_location: sanitizedData.userLocation,
      status: sanitizedData.status || 'pending',
      created_at: new Date().toISOString()
    }

    console.log('Inserting assignment data:', assignmentData)

    const { data: createdAssignment, error: insertError } = await supabase
      .from('assignments')
      .insert([assignmentData])
      .select()
      .single()

    if (insertError) {
      console.error('Database insert failed:', insertError)
      throw insertError
    }

    console.log('Assignment created successfully:', createdAssignment.id)

    return NextResponse.json({ 
      success: true, 
      assignmentId: createdAssignment.id,
      status: createdAssignment.status,
      createdAt: createdAssignment.created_at
    })
    
  } catch (err) {
    console.error('Assignment creation failed:', err)
    return NextResponse.json({ 
      error: 'Failed to create assignment',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const helpIdFilter = searchParams.get('helpId')
    
    console.log('=== FETCHING ASSIGNMENTS ===')
    console.log('Status filter:', statusFilter || 'all')
    console.log('Help ID filter:', helpIdFilter || 'none')
    
    let assignmentQuery = supabase
      .from('assignments')
      .select(`
        *,
        drivers (
          name,
          phone,
          vehicle_type,
          deleted
        )
      `)
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'all') {
      console.log('Applying status filter:', statusFilter)
      assignmentQuery = assignmentQuery.eq('status', statusFilter)
    }

    if (helpIdFilter) {
      console.log('Looking up specific help ID:', helpIdFilter)
      assignmentQuery = assignmentQuery.eq('help_id', helpIdFilter)
    }

    const { data: rawAssignments, error: fetchError } = await assignmentQuery

    if (fetchError) {
      console.error('Failed to fetch assignments:', fetchError)
      throw fetchError
    }

    console.log(`Found ${rawAssignments?.length || 0} assignments`)

    const processedAssignments = (rawAssignments || []).map(assignment => {
      
      const driverIsDeleted = assignment.driver_deleted || 
                             (assignment.driver_id && assignment.drivers?.deleted) ||
                             !assignment.driver_id

      console.log(`Processing assignment ${assignment.id}, driver deleted: ${driverIsDeleted}`)

      let driverDisplayName = 'Unknown Driver'
      let driverDisplayPhone = 'N/A'
      let driverDisplayVehicle = 'N/A'

      if (driverIsDeleted) {
        driverDisplayName = assignment.driver_name_backup || 'Driver Deleted'
        driverDisplayPhone = assignment.driver_phone_backup || 'N/A'
        driverDisplayVehicle = assignment.driver_vehicle_backup || 'N/A'
      } else {
        driverDisplayName = assignment.drivers?.name || 'Unknown Driver'
        driverDisplayPhone = assignment.drivers?.phone || 'N/A'
        driverDisplayVehicle = assignment.drivers?.vehicle_type || 'N/A'
      }

      return {
        id: assignment.id,
        helpId: assignment.help_id,
        driverId: assignment.driver_id,
        userLocation: assignment.user_location,
        status: assignment.status,
        userPhone: assignment.user_phone || null,
        notes: assignment.notes || '',
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        driver_name: driverDisplayName,
        driver_phone: driverDisplayPhone,
        driver_vehicle: driverDisplayVehicle,
        driver_deleted: driverIsDeleted
      }
    })

    console.log('Assignment processing completed')

    const sortedAssignments = processedAssignments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(sortedAssignments)
    
  } catch (err) {
    console.error('Error during assignment fetch:', err)
    return NextResponse.json({ 
      error: 'Failed to fetch assignments',
      reason: err instanceof Error ? err.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}