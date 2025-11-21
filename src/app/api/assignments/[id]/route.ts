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
    
    // Sanitize input data
    const sanitizedData = sanitizeObject(data)
    const { status } = sanitizedData

    const { error } = await supabase
      .from('assignments')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Supabase assignment update error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params 

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase assignment delete error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}