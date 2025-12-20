import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const digits = formData.get('Digits') as string | null

    // Twilio absolute URL for the next action
    const afterDialUrl = 'https://www.getroadhelp.com/api/twilio/after-dial'

    // If first time, or no input yet, ask for 1/2
    if (!digits) {
      return new NextResponse(
        `<Response>
          <Gather numDigits="1" timeout="10" action="https://www.getroadhelp.com/api/twilio/voice-record" method="POST">
            <Say language="de-DE">
              Drücken Sie 1, um Ihre Nachricht aufzuzeichnen. Drücken Sie 2, um die Aufzeichnung abzulehnen. 
              Wenn keine Eingabe erfolgt, wird die Aufzeichnung automatisch gestartet.
            </Say>
          </Gather>
          
          <!-- Auto-record after 10s if no input -->
          <Say language="de-DE">Aufzeichnung wird gestartet...</Say>
          <Record maxLength="120" action="${afterDialUrl}" method="POST" />
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // If user pressed 1 → start recording
    if (digits === '1') {
      return new NextResponse(
        `<Response>
          <Say language="de-DE">Aufzeichnung wird gestartet.</Say>
          <Record maxLength="120" action="${afterDialUrl}" method="POST" />
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // If user pressed 2 → cancel recording
    if (digits === '2') {
      return new NextResponse(
        `<Response>
          <Say language="de-DE">Sie haben die Aufzeichnung abgelehnt. Vielen Dank.</Say>
          <Hangup/>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // If user pressed something else → repeat prompt
    return new NextResponse(
      `<Response>
        <Say language="de-DE">Ungültige Eingabe.</Say>
        <Redirect method="POST">https://www.getroadhelp.com/api/twilio/voice-record</Redirect>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )

  } catch (err) {
    console.error('voice-record route error:', err)
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
}