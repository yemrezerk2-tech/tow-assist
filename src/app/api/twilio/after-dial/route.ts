import { NextResponse } from 'next/server'
import twilio from 'twilio'

function normalize(phone?: string | null): string {
  if (!phone) throw new Error('Missing phone number')
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`
  }
  return cleaned
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const MISSED_STATUSES = ['busy', 'no-answer', 'failed']

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const driver = searchParams.get('driver')
  const formData = await request.formData()
  const dialStatus = formData.get('DialCallStatus') as string | null
  const dialDuration = formData.get('DialCallDuration')
  const dialSid = formData.get('DialCallSid')
  const caller = formData.get('From') as string | null

  console.log('--- AFTER DIAL WEBHOOK ---')
  console.log('Dial Status:', dialStatus)
  console.log('Dial Duration:', dialDuration)
  console.log('Dial CallSid:', dialSid)
  console.log('Caller:', caller)
  console.log('Driver Dialed:', driver)

  // ❌ MISSED CALL → notify driver via WhatsApp
  if (dialStatus && MISSED_STATUSES.includes(dialStatus)) {
    if (caller && driver) {
      const driverPhone = normalize(driver)
      const callerPhone = normalize(caller)

      console.log(`📵 Missed call (${dialStatus}) → notifying driver ${driverPhone}`)

      try {
        const msg = await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM!,
          to: `whatsapp:${driverPhone}`,
          body: `📵 Verpasster Anruf!\n\nEin Kunde hat Sie angerufen, aber Sie waren nicht erreichbar.\n\n📞 Kundennummer: ${callerPhone}\n\nBitte rufen Sie den Kunden so schnell wie möglich zurück.`
        })

        console.log('✅ Missed call WhatsApp sent, SID:', msg.sid)
      } catch (err) {
        console.error('❌ WhatsApp send error (missed call):', err)
      }
    }

    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Der Fahrer ist derzeit nicht verfügbar. Wir haben den Fahrer benachrichtigt.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  // ✅ COMPLETED CALL → send assignment confirmation via template
  if (dialStatus === 'completed' && caller && driver) {
    const driverPhone = normalize(driver)
    const callerPhone = normalize(caller)

    console.log('✅ Answered → sending WhatsApp assignment to', driverPhone)

    try {
      const msg = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM!,
        to: `whatsapp:${driverPhone}`,
        contentSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID!,
        contentVariables: JSON.stringify({
          "1": callerPhone
        })
      })

      console.log('✅ Assignment WhatsApp sent, SID:', msg.sid)
    } catch (err) {
      console.error('❌ WhatsApp send error (completed):', err)
    }
  }

  return new NextResponse(
    `<Response>
      <Say language="de-DE">
        Vielen Dank für Ihren Anruf.
      </Say>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}