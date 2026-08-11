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
    from: '"Writersthing Security" <' + process.env.EMAIL_USER + '>',
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
    from: '"Writersthing Security" <' + process.env.EMAIL_USER + '>',
    to,
    subject,
    html,
  });
};

export const sendLikeNotificationEmail = async (to: string, authorName: string, readerName: string, storyTitle: string, storyUrl: string) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[SIMULATED EMAIL] To: ${to}, Subject: Someone liked your story`);
      return;
    }

    const subject = "Someone liked your story";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2>Good news, ${authorName || 'Author'}!</h2>
        <p><strong>${readerName || 'Someone'}</strong> liked your story '<strong>${storyTitle}</strong>'.</p>
        <div style="margin-top: 30px;">
          <a href="${storyUrl}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Story</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"Writersthing Notifications" <' + process.env.EMAIL_USER + '>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send like email:", error);
    // Suppress error so caller doesn't fail the API request
  }
};

export const sendCommentNotificationEmail = async (to: string, authorName: string, readerName: string, storyTitle: string, commentText: string, storyUrl: string) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[SIMULATED EMAIL] To: ${to}, Subject: New comment on your story`);
      return;
    }

    const subject = "New comment on your story";
    const safeComment = commentText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2>Hi ${authorName || 'Author'},</h2>
        <p><strong>${readerName || 'Someone'}</strong> commented on your story '<strong>${storyTitle}</strong>'.</p>
        <div style="background: #f9fafb; border-left: 4px solid #000; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0; font-style: italic;">"${safeComment}"</p>
        </div>
        <div style="margin-top: 30px;">
          <a href="${storyUrl}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Story</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"Writersthing Notifications" <' + process.env.EMAIL_USER + '>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send comment email:", error);
    // Suppress error so caller doesn't fail the API request
  }
};

export const sendHireRequestNotificationEmail = async (to: string, writerName: string, clientName: string, projectType: string, budgetMin: number | null, budgetMax: number | null, expectedDeadline: string, description: string, acceptUrl: string) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[SIMULATED EMAIL] To: ${to}, Subject: New Hire Request`);
      return;
    }

    const subject = "New Project Request - Writer's Thing";
    let budgetStr = "Not specified";
    if (budgetMin !== null && budgetMax !== null) budgetStr = `\\u20B9${budgetMin} - \\u20B9${budgetMax}`;
    else if (budgetMin !== null) budgetStr = `From \\u20B9${budgetMin}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2>You have a new project request, ${writerName || 'Writer'}!</h2>
        <p><strong>${clientName || 'A client'}</strong> has sent you a project request.</p>
        <div style="background: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 4px; border: 1px solid #eaeaea;">
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Budget:</strong> ${budgetStr}</p>
          <p><strong>Expected Deadline:</strong> ${expectedDeadline || 'Not specified'}</p>
          <p><strong>Description:</strong></p>
          <p style="white-space: pre-wrap;">${description}</p>
        </div>
        <p style="font-size: 0.9em; color: #666;">Note: Contact details will be shared once you accept the request.</p>
        <div style="margin-top: 30px;">
          <a href="${acceptUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View in Dashboard & Accept</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"Writersthing Notifications" <' + process.env.EMAIL_USER + '>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send hire request email:", error);
  }
};

export const sendHireRequestAcceptedEmail = async (to: string, isToWriter: boolean, partnerName: string, partnerEmail: string, partnerPhone: string | null, projectType: string) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[SIMULATED EMAIL] To: ${to}, Subject: Hire Request Accepted`);
      return;
    }

    const subject = isToWriter ? "Contact Details: Project Accepted" : "Your Hire Request was Accepted!";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2>${isToWriter ? 'Project Accepted' : 'Request Accepted!'}</h2>
        <p>${isToWriter 
          ? `You have accepted the request for <strong>${projectType}</strong>. Here are the client's contact details so you can begin:` 
          : `<strong>${partnerName}</strong> has accepted your request for <strong>${projectType}</strong>. You can now contact them directly:`}</p>
        
        <div style="background: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 4px; border: 1px solid #eaeaea;">
          <p><strong>Name:</strong> ${partnerName}</p>
          <p><strong>Email:</strong> <a href="mailto:${partnerEmail}">${partnerEmail}</a></p>
          ${partnerPhone ? `<p><strong>Phone:</strong> ${partnerPhone}</p>` : ''}
        </div>
        <p>You can now continue your conversation outside of Writer's Thing.</p>
      </div>
    `;

    await transporter.sendMail({
      from: '"Writersthing Notifications" <' + process.env.EMAIL_USER + '>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send hire accepted email:", error);
  }
};

export const sendNewsletterWelcomeEmail = async (to: string) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[SIMULATED EMAIL] To: ${to}, Subject: Welcome to Writer's Thing!`);
      return;
    }

    const subject = "Welcome to Writer's Thing!";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2>You're in!</h2>
        <p>Thanks for subscribing to Writer's Thing. We'll make sure you never miss an update, keeping you inspired with our latest releases and news.</p>
        <p>Stay tuned for more updates coming soon!</p>
      </div>
    `;

    await transporter.sendMail({
      from: '"Writersthing Notifications" <' + process.env.EMAIL_USER + '>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send newsletter welcome email:", error);
  }
};
