import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: requests, error } = await supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase contact requests fetch error:', error)
      throw error
    }

    return NextResponse.json(requests || [])
  } catch (error) {
    console.error('Error fetching contact requests:', error)
    return NextResponse.json({ error: 'Failed to fetch contact requests' }, { status: 500 })
  }
}