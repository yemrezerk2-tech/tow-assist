import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeObject } from '@/lib/sanitize'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // Sanitize the input data
    const sanitizedData = sanitizeObject(data)
    const { status } = sanitizedData

    console.log(`Updating contact request ${id} to status: ${status}`)

    const { error } = await supabase
      .from('contact_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Supabase contact request update error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating contact request:', error)
    return NextResponse.json({ error: 'Failed to update contact request' }, { status: 500 })
  }
}