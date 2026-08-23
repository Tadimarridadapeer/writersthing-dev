import { NextResponse } from "next/server";
import { emailService } from "@/services/email.service";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const mobile = formData.get("mobile") as string;
    const city = formData.get("city") as string;
    const portfolio = formData.get("portfolio") as string;
    const driveLink = formData.get("driveLink") as string;
    const about = formData.get("about") as string;
    const why = formData.get("why") as string;
    const resume = formData.get("resume") as File | null;
    
    let resumeBuffer: Buffer | undefined;
    let resumeName: string | undefined;
    let resumeType: string | undefined;

    if (resume) {
      if (resume.size > 4 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "Resume must be less than 4MB" }, { status: 400 });
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(resume.type) && !resume.name.match(/\.(pdf|doc|docx)$/i)) {
        return NextResponse.json({ success: false, error: "Resume must be a PDF or DOC/DOCX file" }, { status: 400 });
      }
      resumeBuffer = Buffer.from(await resume.arrayBuffer());
      resumeName = resume.name;
      resumeType = resume.type || 'application/pdf';
    } else {
      return NextResponse.json({ success: false, error: "Resume is required" }, { status: 400 });
    }

    const data = { name, mobile, city, portfolio, driveLink, about, why };
    
    const success = await emailService.sendCareerEmail(email, data, resumeBuffer, resumeName, resumeType);

    if (success) {
      return NextResponse.json({ success: true, message: "Application submitted successfully" }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to process careers form:", error);
    return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
  }
}
