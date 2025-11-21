import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeDriverData, safeJsonParse } from '@/lib/sanitize'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params 
    const data = await request.json()
    
    const sanitizedData = sanitizeDriverData(data)
    
    let workingHours = sanitizedData.workingHours
    if (typeof workingHours === 'string') {
      workingHours = safeJsonParse(workingHours)
    }

    const updatePayload: any = {
      name: sanitizedData.name,
      phone: sanitizedData.phone,
      latitude: sanitizedData.latitude,
      longitude: sanitizedData.longitude,
      description: sanitizedData.description,
      vehicle_type: sanitizedData.vehicle_type,
      base_price: sanitizedData.base_price,
      available: sanitizedData.available,
      rating: sanitizedData.rating,
      service_areas: Array.isArray(sanitizedData.serviceAreas) ? sanitizedData.serviceAreas : [],
      features: Array.isArray(sanitizedData.features) ? sanitizedData.features : [],
      max_distance: sanitizedData.maxDistance || 50,
      response_time: sanitizedData.responseTime || 30,
      service_type: sanitizedData.serviceType,
      manually_online: sanitizedData.manuallyOnline,
      working_hours: workingHours,
      updated_at: new Date().toISOString()
    }

    if (sanitizedData.archived === false) {
      updatePayload.archived = false
      updatePayload.archived_at = null
      updatePayload.archived_reason = null
      if (updatePayload.name && updatePayload.name.includes('[ARCHIVIERT]')) {
        updatePayload.name = updatePayload.name.replace('[ARCHIVIERT] ', '')
      }
    }

    const { error } = await supabase
      .from('drivers')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: driverData, error: getDriverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()

    if (getDriverError) throw new Error('Could not find driver')

    const { data: pendingJobs, error: jobCheckError } = await supabase
      .from('assignments')
      .select('id, status, help_id')
      .eq('driver_id', id)
      .in('status', ['pending', 'assigned'])

    if (jobCheckError) throw new Error('Unable to verify driver assignment status')

    if (pendingJobs && pendingJobs.length > 0) {
      const jobList = pendingJobs.map(assignment => assignment.help_id).join(', ')
      return NextResponse.json({ 
        error: `Cannot archive ${driverData.name} - they have ${pendingJobs.length} active assignment(s)`,
        activeAssignments: pendingJobs.length,
        assignmentHelpIds: jobList
      }, { status: 400 })
    }

    const archivalTimestamp = new Date().toISOString()
    
    const { error: archiveUpdateError } = await supabase
      .from('drivers')
      .update({ 
        archived: true,
        archived_at: archivalTimestamp,
        archived_reason: 'manually_archived_by_admin',
        available: false,
        manually_online: false,
        original_name: driverData.name,
        name: `[ARCHIVIERT] ${driverData.name}`,
        updated_at: archivalTimestamp
      })
      .eq('id', id)

    if (archiveUpdateError) throw new Error('Failed to update driver archive status')

    return NextResponse.json({ 
      success: true, 
      driverName: driverData.name,
      driverId: id
    })
    
  } catch (error) {
    console.error('Driver archival failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to archive driver'
    }, { status: 500 })
  }
}