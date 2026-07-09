export interface EmailProvider {
  sendOTP(email: string, otp: string): Promise<boolean>;
  sendVerification?(email: string, link: string): Promise<boolean>;
  sendWelcome?(email: string, name: string): Promise<boolean>;
}

export class PlaceholderEmailProvider implements EmailProvider {
  async sendOTP(email: string, otp: string): Promise<boolean> {
    console.log(`[EmailService] TODO: SMTP Integration.`);
    console.log(`[EmailService] Sending OTP ${otp} to ${email}...`);
    // Placeholder logic - pretend it takes 500ms
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[EmailService] OTP Email sent successfully (Mock).`);
    return true;
  }
}

// Factory or default export
export const emailService: EmailProvider = new PlaceholderEmailProvider();
