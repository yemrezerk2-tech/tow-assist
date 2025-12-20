import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type AssignmentWithDriver = {
  help_id: string
  status: string
  driver_name: string | null
  driver_phone: string | null
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const attempt = Number(searchParams.get('attempt') ?? '1')
  const step = searchParams.get('step') ?? 'enter-helpid' // new step param

  const formData = await request.formData()
  const rawDigits = formData.get('Digits') as string | null
  const digits = rawDigits?.replace(/\D/g, '')

  /**
   * 🚫 MAX ATTEMPTS = 3
   */
  if (attempt > 3 && step === 'enter-helpid') {
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
   * STEP 1 — Enter Help ID
   */
  if (step === 'enter-helpid') {
    if (!digits) {
      return new NextResponse(
        `<Response>
          <Gather
            numDigits="4"
            timeout="6"
            method="POST"
            action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}&step=enter-helpid"
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

    // Lookup assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .select('help_id,status,driver_name,driver_phone')
      .eq('help_id', digits)
      .single<AssignmentWithDriver>()

    const driverPhone = assignment?.driver_phone

    if (!assignment || assignment.status !== 'assigned' || !driverPhone) {
      return new NextResponse(
        `<Response>
          <Gather
            numDigits="4"
            timeout="6"
            method="POST"
            action="https://www.getroadhelp.com/api/twilio/voice?attempt=${attempt + 1}&step=enter-helpid"
          >
            <Say language="de-DE">
              Die Hilfe I D ist nicht gültig. Bitte versuchen Sie es erneut.
            </Say>
          </Gather>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Success → move to recording step
    return new NextResponse(
      `<Response>
        <Gather
          numDigits="1"
          timeout="10"
          method="POST"
          action="https://www.getroadhelp.com/api/twilio/voice?step=recording&helpid=${assignment.help_id}"
        >
          <Say language="de-DE">
            Vielen Dank. Wenn Sie eine Sprachnachricht aufnehmen möchten, drücken Sie die 1.
            Wenn nicht, drücken Sie die 2 oder warten Sie 10 Sekunden, um die Aufnahme automatisch zu starten.
          </Say>
        </Gather>
        <Say language="de-DE">
          Keine Eingabe erkannt. Die Aufnahme wird automatisch gestartet.
        </Say>
        <Redirect method="POST">
          https://www.getroadhelp.com/api/twilio/voice?step=recording&helpid=${assignment.help_id}
        </Redirect>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * STEP 2 — Recording
   */
  if (step === 'recording') {
    const helpid = searchParams.get('helpid') ?? 'unknown'
    if (digits === '2') {
      return new NextResponse(
        `<Response>
          <Say language="de-DE">
            Die Aufnahme wurde abgebrochen. Vielen Dank.
          </Say>
          <Hangup/>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Die Aufnahme startet jetzt.
        </Say>
        <Record
          maxLength="60"
          action="https://www.getroadhelp.com/api/twilio/after-dial?helpid=${helpid}"
          method="POST"
          playBeep="true"
        />
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  // fallback
  return new NextResponse(
    `<Response>
      <Say language="de-DE">
        Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.
      </Say>
      <Hangup/>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}