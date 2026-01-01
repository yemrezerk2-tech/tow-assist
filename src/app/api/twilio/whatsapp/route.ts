import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()

  const from = formData.get('From') as string | null
  const body = formData.get('Body') as string | null

  console.log('--- WHATSAPP INBOUND ---')
  console.log('From:', from)
  console.log('Message:', body)

  if (!from || !body) {
    return new NextResponse('Invalid request', { status: 400 })
  }

  const answer = body.trim().toUpperCase()

  if (answer === 'YES') {
    console.log('✅ Task engaged')
  } else if (answer === 'NO') {
    console.log('❌ Task rejected')
  } else {
    console.log('⚠️ Unknown reply')
  }

  return new NextResponse(
    `<Response>
      <Message>
        Thanks. We received your answer.
      </Message>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
