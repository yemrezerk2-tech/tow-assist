import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type AssignmentWithDriver = {
  help_id: string
  status: string
  drivers: {
    name: string
    phone: string
  }[] | null
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const attempt = Number(searchParams.get('attempt') ?? '1')

    const formData = await request.formData()
    const rawDigits = formData.get('Digits') as string | null
    const digits = rawDigits?.replace(/\D/g, '')

    console.log('--- TWILIO VOICE ROUTE ---')
    console.log('Attempt:', attempt)
    console.log('Raw Digits:', rawDigits)
    console.log('Processed Digits:', digits)
    console.log('Digits length:', digits?.length)

    /** 🚫 MAX ATTEMPTS */
    if (attempt > 3) {
      return new NextResponse(
        `<Response>
          <Say language="de-DE">
            Sie haben die maximale Anzahl von Versuchen erreicht.
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
            action="/api/twilio/voice?attempt=${attempt + 1}"
          >
            <Say language="de-DE">
              Bitte geben Sie jetzt Ihre Hilfe I D ein.
            </Say>
          </Gather>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    /** 🔍 LOOK UP ASSIGNMENT */
    const { data, error } = await supabase
      .from('assignments')
      .select(
        `
        help_id,
        status,
        drivers (
          name,
          phone
        )
      `
      )
      .eq('help_id', digits)
      .limit(1)

      const assignment = data?.[0] as AssignmentWithDriver | undefined

      console.log('Supabase assignment:', assignment)
      console.log('Supabase error:', error)
      
      const driver = Array.isArray(assignment?.drivers)
        ? assignment.drivers[0]
        : assignment?.drivers
      
      const driverPhone = driver?.phone
      const driverName = driver?.name
      
      console.log('Driver Name:', driverName)
      console.log('Driver Phone:', driverPhone)

    const validStatuses = ['pending']

    /** ❌ INVALID HELP ID */
    if (
      error ||
      !assignment ||
      !validStatuses.includes(assignment.status) ||
      !driverPhone
    ) {
      return new NextResponse(
        `<Response>
          <Gather
            numDigits="4"
            timeout="6"
            method="POST"
            action="/api/twilio/voice?attempt=${attempt + 1}"
          >
            <Say language="de-DE">
              Die Hilfe I D ist nicht gültig. Bitte versuchen Sie es erneut.
            </Say>
          </Gather>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    /** ✅ VALID HELP ID */
    console.log('Help ID valid. Redirecting to driver.')

    return new NextResponse(
      `<Response>
        <Redirect method="POST">
          /api/twilio/connect-driver?driver=${encodeURIComponent(driverPhone)}
        </Redirect>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  } catch (err) {
    console.error('🔥 TWILIO VOICE ERROR:', err)

    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Ein technischer Fehler ist aufgetreten.
        </Say>
        <Hangup/>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}
