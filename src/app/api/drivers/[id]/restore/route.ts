import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: driver, error: fetchError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw new Error('Could not retrieve driver information')

    if (!driver.archived) {
      return NextResponse.json({ 
        error: 'Driver is not archived and cannot be restored' 
      }, { status: 400 })
    }

    const restoreData: any = {
      archived: false,
      archived_at: null,
      archived_reason: null,
      available: true,
      manually_online: true,
      updated_at: new Date().toISOString()
    }

    if (driver.original_name) {
      restoreData.name = driver.original_name
      restoreData.original_name = null
    } else {
      restoreData.name = driver.name.replace('[ARCHIVIERT] ', '')
    }

    const { error: restoreError } = await supabase
      .from('drivers')
      .update(restoreData)
      .eq('id', id)

    if (restoreError) throw new Error('Failed to restore driver')

    return NextResponse.json({ 
      success: true,
      driverName: restoreData.name,
      driverId: id
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to restore driver' 
    }, { status: 500 })
  }
}