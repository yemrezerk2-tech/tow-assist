import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Assignment = {
  help_id: string
  status: string
  drivers: {
    phone: string
    name: string
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

  /** 🚫 MAX ATTEMPTS */
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

  /** 🔁 ASK FOR HELP ID */
  if (!digits) {
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="4"
          timeout="6"
          method="POST"
          action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}"
        >
          <Say language="de-DE">
            Bitte geben Sie jetzt Ihre Hilfe I D ein.
          </Say>
        </Gather>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /** 🔍 LOOKUP ASSIGNMENT */
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
    .eq('help_id', digits)
    .single<Assignment>()

  console.log('Assignment:', assignment)
  console.log('Error:', error)

  const driverPhone = assignment?.drivers?.phone

  /** ❌ REJECT ONLY INVALID CASES */
  if (
    error ||
    !assignment ||
    assignment.status === 'assigned' || // ✅ FIXED
    !driverPhone
  ) {
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="4"
          timeout="6"
          method="POST"
          action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}"
        >
          <Say language="de-DE">
            Die Hilfe I D ist nicht gültig oder bereits vergeben.
          </Say>
        </Gather>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /** ✅ PENDING → CONNECT DRIVER */
  return new NextResponse(
    `<Response>
      <Redirect method="POST">
        https://www.getroadhelp.com/api/twilio/connect-driver?driver=${encodeURIComponent(
          driverPhone
        )}
      </Redirect>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
