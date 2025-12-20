import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()

  const dialStatus = formData.get('DialCallStatus') as string | null
  const dialDuration = formData.get('DialCallDuration')
  const dialCallSid = formData.get('DialCallSid')
  const caller = formData.get('From')
  const called = formData.get('To')

  console.log('--- AFTER DIAL WEBHOOK ---')
  console.log('Dial Status:', dialStatus)
  console.log('Dial Duration:', dialDuration)
  console.log('Dial CallSid:', dialCallSid)
  console.log('Caller:', caller)
  console.log('Called (Driver):', called)

  /**
   * Speak to caller based on outcome
   */
  if (dialStatus === 'busy') {
    console.log('Driver is busy')
    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Der Fahrer ist derzeit besetzt.
          Wir versuchen es erneut oder verbinden Sie mit einem anderen Fahrer.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  if (dialStatus === 'no-answer') {
    console.log('Driver did not answer')
    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Der Fahrer konnte Ihren Anruf leider nicht entgegennehmen.
          Bitte bleiben Sie in der Leitung.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  if (dialStatus === 'failed') {
    console.log('Driver not reachable')
    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Der Fahrer ist derzeit nicht erreichbar.
          Wir verbinden Sie gleich mit einem anderen Fahrer.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  console.log('Call connected successfully')
  // Successful call
  return new NextResponse(
    `<Response>
      <Say language="de-DE">
        Vielen Dank für Ihren Anruf.
      </Say>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
