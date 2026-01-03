import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const driver = searchParams.get('driver')

  const formData = await request.formData()
  const digits = formData.get('Digits')

  const shouldRecord = digits === '1'

  console.log('--- VOICE RECORD ---')
  console.log('Digits:', digits)
  console.log('Recording:', shouldRecord)
  console.log('Driver:', driver)

  const dial = `
    <Dial
      callerId="${process.env.TWILIO_PHONE_NUMBER}"
      ${shouldRecord ? 'record="record-from-answer"' : ''}
      action="https://www.getroadhelp.com/api/twilio/after-dial"
      method="POST"
      statusCallback="https://www.getroadhelp.com/api/twilio/after-dial"
      statusCallbackEvent="answered completed"
      statusCallbackMethod="POST"
    >
      <Number>${driver}</Number>
    </Dial>
  `

  return new NextResponse(
    `<Response>
      <Say language="de-DE">
        Vielen Dank. Wir verbinden Sie jetzt mit Ihrem Fahrer.
      </Say>
      ${dial}
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
