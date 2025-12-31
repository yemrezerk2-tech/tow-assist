import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Assignment = {
  help_id: string
  status: string
  driver_phone: string | null
  driver_name: string | null
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
   * 🔍 LOOKUP ASSIGNMENT (ONLY ASSIGNMENTS TABLE)
   */
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('help_id, status, driver_phone, driver_name')
    .eq('help_id', digits)
    .single<Assignment>()

  console.log('Assignment:', assignment)
  console.log('Error:', error)

  const driverPhone = assignment?.driver_phone

  /**
   * ❌ REJECT CONDITIONS
   * - not found
   * - status is NOT pending
   * - missing driver phone
   */
  if (
    error ||
    !assignment ||
    assignment.status !== 'pending' ||
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
            Bitte versuchen Sie es erneut.
          </Say>
        </Gather>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * ✅ VALID → CONNECT DRIVER
   */
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
