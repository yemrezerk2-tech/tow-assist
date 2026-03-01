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
  console.log('Test basliyor')

  if (!from || !body) {
    return new NextResponse(
      `<Response>
        <Message>Invalid message.</Message>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  const answer = body.trim().toUpperCase()
  const phone = normalizePhone(from)

  /** 1️⃣ Find driver by phone */
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('id, phone')
    .eq('phone', phone)
    .single()
    
  console.log('Driver tablosundan alinan data', driver, !driver, driverError)

  // Replace your "Driver not found" return with this:
  if (driverError || !driver) {
    return new NextResponse(
      `<Response>
         <Message>Driver not found.</Message>
       </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  console.log('Driver ID:', driver.id)

  /** =========================
   * ✅ YES → accept assignment
   * ========================= */
  if (answer === 'YES') {
    console.log('✅ Task engaged')

    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('id')
      .eq('driver_id', driver.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    if (assignmentError || !assignments || assignments.length === 0) {
      console.log('⚠️ No pending assignment')
      return new NextResponse(
        `<Response>
           <Message>No pending assignment.</Message>
         </Response>`,
        {
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    const assignment = assignments[0]

    const { error: updateAssignmentError } = await supabase
      .from('assignments')
      .update({ status: 'assigned' })
      .eq('id', assignment.id)

    if (updateAssignmentError) {
      console.error('❌ Failed to assign task', updateAssignmentError)
    }

    await supabase
      .from('drivers')
      .update({ available: false }) // boolean
      .eq('id', driver.id)

    console.log('✅ Assignment locked & driver unavailable')
  }

  /** ======================
   * ❌ NO → reject task
   * ====================== */
  if (answer === 'NO') {
    console.log('❌ Task rejected')

    await supabase
      .from('assignments')
      .update({ status: 'rejected' })
      .eq('driver_id', driver.id)
      .eq('status', 'pending')
  }

  /** ==========================
   * 🔄 COMPLETE → finish task
   * ========================== */
  if (answer === 'COMPLETE') {
    console.log('🔄 Driver finished task')

    const { data: assignment } = await supabase
      .from('assignments')
      .select('id')
      .eq('driver_id', driver.id)
      .eq('status', 'assigned')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (assignment) {
      await supabase
        .from('assignments')
        .update({ status: 'completed' })
        .eq('id', assignment.id)
    }

    await supabase
      .from('drivers')
      .update({ available: true }) // driver is free again
      .eq('id', driver.id)

    console.log('✅ Task completed, driver available')
  }

  const confirmationMessages: Record<string, string> = {
  YES: '✅ You accepted the assignment. You are now marked as unavailable.',
  NO: '❌ You rejected the assignment.',
  COMPLETE: '🔄 Task marked as complete. You are now available again.'
}

const confirmation = confirmationMessages[answer] ?? `We received your reply: "${answer}"`

return new NextResponse(
  `<Response>
    <Message>${confirmation}</Message>
  </Response>`,
  { headers: { 'Content-Type': 'text/xml' } }
)
}
