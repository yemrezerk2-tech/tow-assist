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

  console.log('--- TWILIO VOICE ROUTE ---')
  console.log('Attempt:', attempt)
  console.log('Raw Digits:', rawDigits)
  console.log('Processed Digits:', digits)

  /**
   * 🚫 MAX ATTEMPTS = 3
   */
  if (attempt > 3) {
    console.log('Max attempts reached. Hanging up.')
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
   * 🔁 ASK FOR HELP ID
   */
  if (!digits) {
    console.log('No digits entered. Asking again.')
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="4"
          timeout="6"
          method="POST"
          action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}"
        >
          <Say language="de-DE">
            ${
              attempt === 1
                ? 'Willkommen bei Road Assistance. Bitte geben Sie jetzt Ihre Hilfe I D ein.'
                : attempt === 3
                ? 'Letzter Versuch. Bitte geben Sie jetzt Ihre Hilfe I D ein.'
                : 'Die Eingabe war ungültig. Bitte versuchen Sie es erneut.'
            }
          </Say>
        </Gather>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * 🔍 LOOKUP ASSIGNMENT
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

  console.log('Supabase assignment data:', assignment)
  console.log('Supabase error:', error)

  const driverPhone = assignment?.drivers?.phone
  const driverName = assignment?.drivers?.name

  console.log('Driver Name:', driverName)
  console.log('Driver Phone:', driverPhone)

  /**
   * ❌ INVALID HELP ID → re-ask (NO REDIRECT)
   */
  if (!assignment || assignment.status !== 'assigned' || !driverPhone) {
    console.log('Invalid help ID or driver not available. Re-asking.')
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="4"
          timeout="6"
          method="POST"
          action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}"
        >
          <Say language="de-DE">
            Die Hilfe I D ist nicht gültig. Bitte versuchen Sie es erneut.
          </Say>
        </Gather>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * ✅ CONNECT DRIVER
   */
  console.log('Connecting caller to driver...')
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
        <Number>${driverPhone}</Number>
      </Dial>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
