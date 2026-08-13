import { NextResponse } from "next/server";
import { emailService } from "@/services/email.service";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const success = await emailService.sendContactEmail(data.email, data.name, data.message);

    if (success) {
      return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to process contact form:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
