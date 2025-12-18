import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Types
 */
type AssignmentWithDriver = {
  help_id: string
  status: string
  drivers: {
    name: string
    phone: string
  } | null
}

/**
 * TWILIO VOICE WEBHOOK
 * Flow:
 * 1. Ask caller to enter Hilfe-ID
 * 2. Lookup assignment
 * 3. Connect to driver
 */
export async function POST(request: Request) {
  // Read Twilio form data
  const formData = await request.formData()
  const rawDigits = formData.get('Digits') as string | null
  const digits = rawDigits?.replace(/\D/g, '')

  /**
   * STEP 1 — Ask for Hilfe-ID
   */
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

  /**
   * STEP 2 — Hilfe-ID
   */
  const helpId = digits

  /**
   * STEP 3 — Lookup assignment + driver
   */
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      help_id,
      status,
      drivers (
        name,
        phone
      )
    `)
    .eq('help_id', helpId)
    .single<AssignmentWithDriver>()

  const driverPhone = assignment?.drivers?.phone

  /**
   * DEBUG LOGS (Vercel)
   */
  console.log('HELP ID:', helpId)
  console.log('ASSIGNMENT:', assignment)
  console.log('ERROR:', error)
  console.log('DRIVER PHONE:', driverPhone)

  /**
   * STEP 4 — Validation
   */
  if (
    error ||
    !assignment ||
    assignment.status !== 'assigned' ||
    !driverPhone
  ) {
    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Diese Hilfe I D ist nicht mehr aktiv.
          Bitte wenden Sie sich an unseren Support.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * STEP 5 — Connect caller to driver
   */
  return new NextResponse(
    `<Response>
      <Say language="de-DE">
        Vielen Dank. Wir verbinden Sie jetzt mit Ihrem Fahrer.
      </Say>
      <Dial
        callerId="${process.env.TWILIO_PHONE_NUMBER}"
        action="https://www.getroadhelp.com/api/twilio/after-dial"
        method="POST"
      >
        ${driverPhone}
      </Dial>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
