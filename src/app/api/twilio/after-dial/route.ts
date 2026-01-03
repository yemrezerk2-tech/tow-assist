import { NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,  
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const driverPhone = searchParams.get('driver')

  const formData = await request.formData()

  const dialStatus = formData.get('DialCallStatus')
  const dialDuration = formData.get('DialCallDuration')
  const dialSid = formData.get('DialCallSid')
  const caller = formData.get('Caller') as string | null

  console.log('--- AFTER DIAL WEBHOOK ---')
  console.log('Dial Status:', dialStatus)
  console.log('Dial Duration:', dialDuration)
  console.log('Dial CallSid:', dialSid)
  console.log('Caller:', caller)
  console.log('Driver Dialed:', driverPhone)

  if (dialStatus === 'busy' || dialStatus === 'no-answer' || dialStatus === 'failed') {
    return new NextResponse(
      `<Response>
        <Say language="de-DE">
          Der Fahrer ist derzeit nicht verfügbar.
        </Say>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  /**
   * ✅ SUCCESS → SEND WHATSAPP MESSAGE
   */

  function normalize(phone?: string | null): string {
    if (!phone) throw new Error('Missing phone number')
  
    // Remove spaces, quotes, invisible chars
    let cleaned = phone.replace(/[^\d+]/g, '')
  
    // Ensure leading +
    if (!cleaned.startsWith('+')) {
      cleaned = `+${cleaned}`
    }
  
    return cleaned
  } 

  if (dialStatus === 'answered' && caller && driverPhone) {
    const driver = normalize(driverPhone)
    const callerPhone = normalize(caller)
  
    console.log('Answered → sending WhatsApp to', driver)
  
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to: `whatsapp:${driver}`,
      body: `Caller: ${callerPhone}
  
  Task engaged?
  Reply with:
  YES
  NO`,
    })
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
