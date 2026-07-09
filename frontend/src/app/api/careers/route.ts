import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

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
    
    // Check if email credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("SMTP credentials missing. Form submitted but email not sent.");
      return NextResponse.json({ success: true, message: "Simulated success" }, { status: 200 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const attachments = [];
    if (resume) {
      const buffer = Buffer.from(await resume.arrayBuffer());
      attachments.push({
        filename: resume.name,
        content: buffer,
        contentType: resume.type || 'application/pdf'
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "thewritersthing@gmail.com",
      replyTo: email,
      subject: `New Career Application - Writer's Thing`,
      text: `New application from ${name}.\nEmail: ${email}\nMobile: ${mobile}\nCity: ${city}`,
      html: `
        <h3>New Career Application</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>City:</strong> ${city}</p>
        <p><strong>Portfolio:</strong> ${portfolio || "N/A"}</p>
        <p><strong>Drive Link:</strong> <a href="${driveLink}">${driveLink}</a></p>
        <br/>
        <h4>About:</h4>
        <p>${about.replace(/\n/g, "<br>")}</p>
        <br/>
        <h4>Why Writer's Thing:</h4>
        <p>${why.replace(/\n/g, "<br>")}</p>
      `,
      attachments
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Application submitted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to process careers form:", error);
    return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
  }
}
