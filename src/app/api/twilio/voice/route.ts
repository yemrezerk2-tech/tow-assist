import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const formData = await request.formData()
  const rawDigits = formData.get('Digits') as string | null
  const digits = rawDigits?.replace(/\D/g, '')

  // STEP 1 — Ask for Hilfe-ID
  if (!digits) {
    
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="4"
          action="https://www.getroadhelp.com/api/twilio/voice"
          method="POST"
          timeout="6"
        >
          <Say language="de-DE">
            Willkommen bei Road Assistance.
            Bitte geben Sie jetzt Ihre Hilfe I D ein.
          </Say>
        </Gather>
        <Say language="de-DE">
          Wir haben keine Eingabe erhalten. Bitte rufen Sie erneut an.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  // STEP 2 — Hilfe-ID
  const helpId = digits

  // STEP 3 — Lookup assignment
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      help_id,
      status,
      drivers (
        phone,
        name
      )
    `)
    .eq('help_id', helpId)
    .single() // returns single row or null

  const driver = assignment?.drivers // get first driver

  // STEP 4 — Validation
  if (!assignment || error || assignment.status !== 'assigned' || !driver) {
    console.log('HELP ID:', helpId)
    console.log('ASSIGNMENT:', assignment)
    console.log('ERROR:', error)
    console.log('driver:', driver)
    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Diese Hilfe I D ist nicht mehr aktiv.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  // STEP 5 — Connect caller
  console.log('HELP ID:', helpId)
  console.log('ASSIGNMENT:', assignment)
  console.log('ERROR:', error)
  console.log('driver:', driver)
  return new NextResponse(
    `<Response>
      <Say language="de-DE">
        Vielen Dank. Wir verbinden Sie jetzt mit Ihrem Fahrer.
      </Say>
      <Dial callerId="${process.env.TWILIO_PHONE_NUMBER}">
        ${driver}
      </Dial>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
