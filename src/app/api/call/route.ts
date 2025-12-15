import { NextResponse } from "next/server";
import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER!; // Twilio number to call from

const client = Twilio(accountSid, authToken);

export async function POST(req: Request) {
  try {
    const { to } = await req.json(); // phone number to call

    const call = await client.calls.create({
      to,
      from: twilioNumber,
      twiml: '<Response><Say voice="alice">Ihre Hilfe ist unterwegs!</Say></Response>',
    });

    return NextResponse.json({ success: true, sid: call.sid });
  } catch (error) {
    console.error("Twilio call error:", error);
    return NextResponse.json({ success: false, error: error });
  }
}
