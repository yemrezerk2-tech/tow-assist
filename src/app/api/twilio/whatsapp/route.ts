import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // adjust if needed

export async function POST(request: Request) {
  const formData = await request.formData()

  const body = formData.get('Body')?.toString().trim()
  const from = formData.get('From')?.toString() // whatsapp:+...

  console.log('📩 WhatsApp Reply:', body, 'From:', from)

  if (!from) {
    return NextResponse.json({ ok: false })
  }

  // Find assignment by driver phone
  const assignment = await prisma.assignment.findFirst({
    where: {
      driverPhone: from.replace('whatsapp:', ''),
      status: 'pending',
    },
  })

  if (!assignment) {
    return new NextResponse(
      `<Response><Message>No active assignment found.</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  if (body === '1' || body?.toLowerCase() === 'yes') {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: 'assigned' },
    })

    return new NextResponse(
      `<Response><Message>✅ Assignment confirmed. Thank you!</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  return new NextResponse(
    `<Response><Message>❌ Assignment not confirmed.</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
