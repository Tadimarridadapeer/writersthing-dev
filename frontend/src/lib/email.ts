import nodemailer from "nodemailer";

export const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("SMTP credentials missing. Email simulated.");
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendUpiOtpEmail = async (to: string, otp: string, purpose: 'setup' | 'change') => {
  const transporter = getTransporter();
  const subject = purpose === 'setup' ? "Verify your UPI ID Setup" : "Verify your UPI ID Change Request";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2>Writersthing - Security Verification</h2>
      <p>You have requested to ${purpose === 'setup' ? 'setup a new' : 'change your'} payout UPI ID.</p>
      <p>Your one-time password (OTP) is:</p>
      <h1 style="background: #f4f4f5; padding: 10px 20px; letter-spacing: 5px; text-align: center; border-radius: 4px;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this, please secure your account immediately.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}, OTP: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: `"Writersthing Security" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendUpiChangeNotification = async (to: string, oldUpi: string | null, newUpi: string, ip: string, device: string) => {
  const transporter = getTransporter();
  const subject = "Security Alert: UPI ID Change Requested";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2>Security Alert</h2>
      <p>A request to change your payout UPI ID has been initiated.</p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Previous UPI:</strong> ${oldUpi || 'None'}</p>
        <p><strong>Requested New UPI:</strong> ${newUpi}</p>
        <p><strong>Requested At:</strong> ${new Date().toUTCString()}</p>
        <p><strong>IP Address:</strong> ${ip}</p>
        <p><strong>Device:</strong> ${device}</p>
      </div>
      <p><strong>Security Hold:</strong> The new UPI ID will not be activated for 24 hours. If this was not you, please log in to your account and cancel the request immediately.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: `"Writersthing Security" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
