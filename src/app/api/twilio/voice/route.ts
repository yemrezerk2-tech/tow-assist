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
  const digitsRaw = formData.get('Digits') as string | null
  const digits = digitsRaw?.replace(/\D/g, '')

  /* 🚫 Max attempts */
  if (attempt > 3) {
    return xml(`
      <Response>
        <Say language="de-DE">
          Sie haben die maximale Anzahl von Versuchen erreicht.
          Bitte wenden Sie sich an unseren Support.
        </Say>
        <Hangup/>
      </Response>
    `)
  }

  /* 🔁 Ask for Help-ID */
  if (!digits) {
    return xml(`
      <Response>
        <Gather
          numDigits="4"
          timeout="6"
          action="/api/twilio/voice?attempt=${attempt + 1}"
          method="POST"
        >
          <Say language="de-DE">
            ${attempt === 1
              ? 'Bitte geben Sie jetzt Ihre Hilfe I D ein.'
              : 'Ungültige Eingabe. Bitte geben Sie Ihre Hilfe I D erneut ein.'}
          </Say>
        </Gather>
        <Say language="de-DE">
          Keine Eingabe erhalten.
        </Say>
      </Response>
    `)
  }

  /* 🔍 Lookup assignment */
  const { data: assignment } = await supabase
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

  if (!assignment || assignment.status !== 'assigned' || !driverPhone) {
    return xml(`
      <Response>
        <Redirect method="POST">
          /api/twilio/voice?attempt=${attempt + 1}
        </Redirect>
      </Response>
    `)
  }

  /* 🎙 Ask for recording choice */
  return xml(`
    <Response>
      <Gather
        numDigits="1"
        timeout="10"
        action="/api/twilio/voice-record?phone=${driverPhone}"
        method="POST"
      >
        <Say language="de-DE">
          Möchten Sie eine Nachricht aufnehmen?
          Drücken Sie 1 für Ja oder 2 für Nein.
        </Say>
      </Gather>

      <!-- ⏱ Timeout → auto record -->
      <Redirect method="POST">
        /api/twilio/voice-record?phone=${driverPhone}&auto=1
      </Redirect>
    </Response>
  `)
}

/* Helper */
function xml(body: string) {
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/xml' }
  })
}