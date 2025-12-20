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
  const recordDecision = searchParams.get('record') // "yes" | "no" | null

  const formData = await request.formData()
  const rawDigits = formData.get('Digits') as string | null
  const digits = rawDigits?.replace(/\D/g, '')

  console.log('--- TWILIO VOICE ROUTE ---')
  console.log('Attempt:', attempt)
  console.log('Raw Digits:', rawDigits)
  console.log('Processed Digits:', digits)
  console.log('Record decision:', recordDecision)

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
  if (!digits && !recordDecision) {
    console.log('No digits entered. Asking for Help ID.')
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
   * 🔍 LOOKUP ASSIGNMENT (only once, after Help ID)
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
   * ❌ INVALID HELP ID
   */
  if (!assignment || assignment.status !== 'assigned' || !driverPhone) {
    console.log('Invalid help ID or driver not available.')
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
   * 🎙️ ASK FOR RECORDING DECISION
   */
  if (!recordDecision) {
    console.log('Asking caller for recording permission.')
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="1"
          timeout="10"
          method="POST"
          action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt}&record=pending&helpId=${digits}"
        >
          <Say language="de-DE">
            Dieser Anruf kann zu Qualitätszwecken aufgezeichnet werden.
            Drücken Sie die Eins, um der Aufzeichnung zuzustimmen.
          </Say>
        </Gather>

        <!-- Timeout → no recording -->
        <Redirect method="POST">
          https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt}&record=no&helpId=${digits}
        </Redirect>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * 🎧 HANDLE RECORDING DECISION
   */
  const shouldRecord = rawDigits === '1' || recordDecision === 'yes'

  console.log('Recording enabled:', shouldRecord)

  /**
   * ✅ CONNECT DRIVER
   */
  console.log('Connecting caller to driver...')
console.log('Recording enabled:', shouldRecord)

const dialXml = shouldRecord
  ? `
    <Dial
      callerId="${process.env.TWILIO_PHONE_NUMBER}"
      record="record-from-answer"
      action="https://www.getroadhelp.com/api/twilio/after-dial?driver=${encodeURIComponent(driverPhone)}"
      method="POST"
    >
      <Number>${driverPhone}</Number>
    </Dial>
  `
  : `
    <Dial
      callerId="${process.env.TWILIO_PHONE_NUMBER}"
      action="https://www.getroadhelp.com/api/twilio/after-dial?driver=${encodeURIComponent(driverPhone)}"
      method="POST"
    >
      <Number>${driverPhone}</Number>
    </Dial>
  `

return new NextResponse(
  `<Response>
    <Say language="de-DE">
      Vielen Dank. Wir verbinden Sie jetzt mit Ihrem Fahrer.
    </Say>
    ${dialXml}
  </Response>`,
  { headers: { 'Content-Type': 'text/xml' } }
)

}
