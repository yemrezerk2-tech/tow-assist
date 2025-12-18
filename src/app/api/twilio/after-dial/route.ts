import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()

  const dialStatus = formData.get('DialCallStatus') as string | null
  const dialDuration = formData.get('DialCallDuration')

  console.log('📞 Dial Status:', dialStatus)
  console.log('⏱ Duration:', dialDuration)

  /**
   * Speak to caller based on outcome
   */
  if (dialStatus === 'busy') {
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
