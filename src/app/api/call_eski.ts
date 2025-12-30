import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()

  const callSid = formData.get('CallSid')
  const callStatus = formData.get('CallStatus')
  const to = formData.get('To')
  const from = formData.get('From')

  console.log('📞 CALL STATUS CALLBACK')
  console.log('CallSid:', callSid)
  console.log('Status:', callStatus)
  console.log('To (Driver):', to)
  console.log('From (Caller):', from)

  /**
   * Handle outcomes
   */
  switch (callStatus) {
    case 'completed':
      console.log('✅ Call completed successfully')
      break

    case 'busy':
      console.log('📵 Driver phone is busy')
      break

    case 'no-answer':
      console.log('⏱ Driver did not answer')
      break

    case 'failed':
      console.log('❌ Call failed / unreachable')
      break

    default:
      console.log('ℹ️ Unknown status')
  }

  return NextResponse.json({ received: true })
}
