import { NextResponse } from 'next/server'
import twilio from 'twilio'

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

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,  
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const driver = searchParams.get('driver')

  const formData = await request.formData()
  const dialStatus = formData.get('DialCallStatus')
  const dialDuration = formData.get('DialCallDuration')
  const dialSid = formData.get('DialCallSid')
  const caller = formData.get('From') as string | null


  console.log('--- AFTER DIAL WEBHOOK ---')
  console.log('Dial Status:', dialStatus)
  console.log('Dial Duration:', dialDuration)
  console.log('Dial CallSid:', dialSid)
  console.log('Caller:', caller)
  console.log('Driver Dialed:', driver)

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

  if (dialStatus === 'completed' && caller && driver) {
    const driverPhone = normalize(driver)
    const callerPhone = normalize(caller)
  
    console.log('Answered → sending WhatsApp to', driver)
  
    try {
      const msg = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM!,
        to: `whatsapp:${driverPhone}`,
        contentSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID!,
        contentVariables: JSON.stringify({
          "1": callerPhone
        })
      })
    
      console.log('WhatsApp sent SID:', msg.sid)
    
    } catch (err) {
      console.error('WhatsApp send error:', err)
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
