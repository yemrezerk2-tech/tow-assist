import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type AssignmentWithDriver = {
  help_id: string
  status: string
  drivers: {
    name: string
    phone: string
  } | null
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const attempt = Number(searchParams.get('attempt') ?? '1')

  const formData = await request.formData()
  const rawDigits = formData.get('Digits') as string | null
  const digits = rawDigits?.replace(/\D/g, '')

  /**
   * 🚫 Max attempts reached → say + hang up
   */
  if (attempt > 4) {
    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Sie haben die maximale Anzahl von Versuchen erreicht.
          Bitte wenden Sie sich an unseren Support.
        </Say>
        <Hangup/>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * 🔁 Ask for Hilfe-ID (first time or retry)
   */
  if (!digits) {
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="4"
          action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}"
          method="POST"
          timeout="6"
        >
          <Say language="de-DE">
            ${
              attempt === 1
                ? 'Willkommen bei Road Assistance. Bitte geben Sie jetzt Ihre Hilfe I D ein.'
                : 'Die Eingabe war ungültig. Bitte geben Sie Ihre Hilfe I D erneut ein.'
            }
          </Say>
        </Gather>
        <Say language="de-DE">
          Wir haben keine Eingabe erhalten.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * 🔍 Lookup assignment + driver
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
    .eq('help_id', digits)
    .single<AssignmentWithDriver>()

  const driverPhone = assignment?.drivers?.phone

  console.log('HELP ID:', digits)
  console.log('ATTEMPT:', attempt)
  console.log('ASSIGNMENT:', assignment)
  console.log('ERROR:', error)
  console.log('DRIVER PHONE:', driverPhone)

  /**
   * ❌ Invalid Help-ID → retry (counts as attempt)
   */
  if (
    error ||
    !assignment ||
    assignment.status !== 'assigned' ||
    !driverPhone
  ) {
    return new NextResponse(
      `<Response>
        <Redirect method="POST">
          https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}
        </Redirect>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * ✅ Success → connect caller
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
