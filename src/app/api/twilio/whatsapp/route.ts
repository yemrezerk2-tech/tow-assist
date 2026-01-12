import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function normalizePhone(phone: string) {
  return phone.replace('whatsapp:', '').replace(/[^\d+]/g, '')
}

export async function POST(request: Request) {
  const formData = await request.formData()

  const from = formData.get('From') as string | null
  const body = formData.get('Body') as string | null

  console.log('--- WHATSAPP INBOUND ---')
  console.log('From:', from)
  console.log('Message:', body)

  if (!from || !body) {
    return new NextResponse('Invalid request', { status: 400 })
  }

  const answer = body.trim().toUpperCase()
  const phone = normalizePhone(from)

  /** 1️⃣ Find driver by phone */
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('id, phone')
    .eq('phone', phone)
    .single()

  if (driverError || !driver) {
    console.error('❌ Driver not found')
    return new NextResponse('Driver not found', { status: 404 })
  }

  console.log('Driver ID:', driver.id)

  if (answer === 'YES') {
    console.log('✅ Task engaged')
  
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id')
      .eq('driver_id', driver.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }) // latest
      .limit(1)
  
    if (error || !assignments || assignments.length === 0) {
      console.log('⚠️ No pending assignment')
      return
    }
  
    const assignment = assignments[0]
  
    const { error: updateError } = await supabase
      .from('assignments')
      .update({ status: 'assigned' })
      .eq('id', assignment.id)
  
    if (updateError) {
      console.error('❌ Failed to assign task', updateError)
    } else {
      console.log('✅ Assignment locked to driver')
    }
  }
  

  if (answer === 'NO') {
    console.log('❌ Task rejected')

    await supabase
      .from('assignments')
      .update({ status: 'rejected' })
      .eq('driver_id', driver.id)
      .eq('status', 'pending')
      .limit(1)
  }

  if (answer === 'COMPLETE') {
    console.log('🔄 Driver finished task, setting status to pending')
    const { error } = await supabase
      .from('assignments')
      .update({ status: 'pending' })
      .eq('status', 'assigned')
      .order('created_at', { ascending: true })
      .limit(1)
    
    if (error) {
      console.error('❌ Failed to update driver status', error)
      return new NextResponse('Failed to update driver status', { status: 500 })
    }

    console.log('✅ Driver status updated to pending')
  } 

  return new NextResponse(
    `<Response>
      <Message>Thanks. We received your answer.</Message>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
