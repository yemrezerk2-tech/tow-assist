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
   * 🚫 MAX ATTEMPTS (3)
   */
  if (attempt > 3) {
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
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="4"
          timeout="6"
          action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}"
          method="POST"
        >
          <Say language="de-DE">
            ${
              attempt === 1
                ? 'Willkommen bei Road Assistance. Bitte geben Sie jetzt Ihre Hilfe I D ein.'
                : 'Die Hilfe I D war ungültig. Bitte versuchen Sie es erneut.'
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

  const driverPhone = assignment?.drivers?.phone

  console.log('HELP ID:', digits)
  console.log('ATTEMPT:', attempt)
  console.log('ASSIGNMENT:', assignment)

  /**
   * ❌ INVALID HELP ID → retry ONCE
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
          Diese Hilfe I D ist nicht gültig.
        </Say>
        <Redirect method="POST">
          https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}
        </Redirect>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * ✅ CONNECT DRIVER
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
