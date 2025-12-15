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
          numDigits="6"
          action="/api/twilio/voice"
          method="POST"
          timeout="8"
        >
          <Say language="de-DE">
            Willkommen bei Road Help.
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
  const helpId = `HLP${digits.slice(0, 4)}`

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

  if (error || !assignment || !assignment.drivers?.phone) {
    return new NextResponse(
      `
      <Response>
        <Say language="de-DE">
          Leider konnten wir Ihre Hilfe I D nicht finden.
          Bitte wenden Sie sich an unseren Support.
        </Say>
      </Response>
      `,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  const driverPhone = assignment.drivers.phone

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
