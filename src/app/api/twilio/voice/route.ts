import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * TWILIO VOICE WEBHOOK
 * Flow:
 * 1. Ask caller to enter Hilfe-ID
 * 2. Lookup assignment
 * 3. Connect to driver
 */

export async function POST(request: Request) {
  const formData = await request.formData()

  const digits = formData.get('Digits') as string | null

  // STEP 1 — Ask for Hilfe-ID
  if (!digits) {
    return new NextResponse(
      `
      <Response>
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
      </Response>
      `,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  // STEP 2 — Normalize Hilfe-ID (digits → HLPXXXX)
  // const helpId = `HLP${digits.slice(0, 4)}`
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
    .single()
  
  const driver = assignment?.drivers?.[0]

  if (
    error ||
    !assignment ||
    // assignment.status !== 'assigned' ||
    assignment.status !== 'pending' ||
    !driver?.phone
  )
    return new NextResponse(
      `
      <Response>
        <Say language="de-DE">
          Diese Hilfe I D ist nicht mehr aktiv.
          Bitte wenden Sie sich an unseren Support.
        </Say>
      </Response>
      `,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  const driverPhone = driver.phone

  // STEP 4 — Connect caller to driver
  return new NextResponse(
    `
    <Response>
      <Say language="de-DE">
        Vielen Dank. Wir verbinden Sie jetzt mit Ihrem Fahrer.
      </Say>
      <Dial callerId="${process.env.TWILIO_PHONE_NUMBER}">
        ${driverPhone}
      </Dial>
    </Response>
    `,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
