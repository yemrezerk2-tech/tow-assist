import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.getroadhelp.com';
const AFTER_DIAL_URL = `${BASE_URL}/api/twilio/after-dial`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const digits = formData.get('Digits') as string | null;

    // No input → prompt
    if (!digits) {
      return new NextResponse(
        `<Response>
          <Gather numDigits="1" timeout="10" action="${BASE_URL}/api/twilio/voice-record" method="POST">
            <Say language="de-DE">
              Drücken Sie 1, um Ihre Nachricht aufzuzeichnen. Drücken Sie 2, um die Aufzeichnung abzulehnen.
              Nach 10 Sekunden startet die Aufzeichnung automatisch.
            </Say>
          </Gather>
          <Say language="de-DE">Aufzeichnung wird gestartet...</Say>
          <Record maxLength="120" action="${AFTER_DIAL_URL}" method="POST"/>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Digit input
    if (digits === '1') {
      return new NextResponse(
        `<Response>
          <Say language="de-DE">Aufzeichnung wird gestartet.</Say>
          <Record maxLength="120" action="${AFTER_DIAL_URL}" method="POST"/>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    if (digits === '2') {
      return new NextResponse(
        `<Response>
          <Say language="de-DE">Sie haben die Aufzeichnung abgelehnt. Vielen Dank.</Say>
          <Hangup/>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Invalid input → retry
    return new NextResponse(
      `<Response>
        <Say language="de-DE">Ungültige Eingabe.</Say>
        <Redirect method="POST">${BASE_URL}/api/twilio/voice-record</Redirect>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (err) {
    console.error('voice-record route error:', err);
    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.
        </Say>
        <Hangup/>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
}
