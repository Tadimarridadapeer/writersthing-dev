export interface EmailProvider {
  sendOTP(email: string, otp: string): Promise<boolean>;
  sendVerification?(email: string, link: string): Promise<boolean>;
  sendWelcome?(email: string, name: string): Promise<boolean>;
}

import nodemailer from "nodemailer";

export class NodemailerEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.example.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || "user",
        pass: process.env.SMTP_PASS || "pass",
      },
    });
  }

  async sendOTP(email: string, otp: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST) {
        console.log(`[EmailService] Dev Mode - Mocking OTP ${otp} to ${email}`);
        return true;
      }

      await this.transporter.sendMail({
        from: `"Antigravity Writers Thing" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: "Your OTP Code",
        text: `Your One-Time Password is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Verification Code</h2>
            <p>Your One-Time Password is:</p>
            <h1 style="background: #f4f4f5; padding: 10px 20px; border-radius: 8px; display: inline-block; letter-spacing: 2px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      });
      console.log(`[EmailService] OTP sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error("[EmailService] Error sending email:", error);
      return false;
    }
  }
}

// Factory or default export
export const emailService: EmailProvider = new NodemailerEmailProvider();
