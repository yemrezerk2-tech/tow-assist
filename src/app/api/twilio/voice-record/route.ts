import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const driverPhone = searchParams.get('phone')
  const auto = searchParams.get('auto') === '1'

  const formData = await request.formData()
  const digit = formData.get('Digits')

  /* 🎙 Start recording */
  if (digit === '1' || auto) {
    return xml(`
      <Response>
        <Say language="de-DE">
          Die Aufnahme beginnt jetzt.
        </Say>

        <Record
          maxLength="120"
          timeout="10"
          action="/api/twilio/connect-driver?phone=${driverPhone}"
          method="POST"
        />
      </Response>
    `)
  }

  /* ⏭ Skip recording */
  if (digit === '2') {
    return xml(`
      <Response>
        <Redirect method="POST">
          /api/twilio/connect-driver?phone=${driverPhone}
        </Redirect>
      </Response>
    `)
  }

  /* fallback */
  return xml(`<Response><Hangup/></Response>`)
}

function xml(body: string) {
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/xml' }
  })
}