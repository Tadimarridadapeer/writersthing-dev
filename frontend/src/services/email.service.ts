import { resend } from '@/lib/resend';
// React imports removed to avoid conflicts
import * as React from 'react';

const defaultFrom = process.env.EMAIL_FROM || 'hello@writersthing.com';

type EmailResponse = { success: true; data?: any } | { success: false; error: string };

export const emailService = {
  sendEmail: async (options: { to: string; subject: string; html?: string; react?: React.ReactElement; from?: string; attachments?: any[] }): Promise<EmailResponse> => {
    try {
      const data = await resend.emails.send({
        from: options.from || defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        react: options.react,
        attachments: options.attachments,
      });
      return { success: true, data };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  },

  // Removed React email methods to avoid conflicts

  // Note: Existing API methods kept for backwards compatibility (they were previously returning boolean, updated here to use sendEmail and map the response)
  sendUpiOtpEmail: async (to: string, otp: string, purpose: 'setup' | 'change') => {
    const subject = purpose === 'setup' ? "Verify your UPI ID Setup" : "Verify your UPI ID Change Request";
    const html = `<h2>Security Verification</h2><p>OTP: ${otp}</p>`;
    const result = await emailService.sendEmail({ to, subject, html });
    return result.success;
  },

  sendUpiChangeNotification: async (to: string, oldUpi: string | null, newUpi: string, ip: string, device: string) => {
    const html = `<p>UPI Changed from ${oldUpi} to ${newUpi}</p>`;
    const result = await emailService.sendEmail({ to, subject: "Security Alert: UPI ID Change Requested", html });
    return result.success;
  },

  sendOTP: async (to: string, otp: string) => {
    const html = `<h2>OTP</h2><p>${otp}</p>`;
    const result = await emailService.sendEmail({ to, subject: "Your OTP Code", html });
    return result.success;
  },

  sendLikeNotificationEmail: async (to: string, authorName: string, readerName: string, storyTitle: string, storyUrl: string) => {
    const html = `<p>${readerName} liked ${storyTitle}</p>`;
    const result = await emailService.sendEmail({ to, subject: "Someone liked your story", html });
    return result.success;
  },

  sendCommentNotificationEmail: async (to: string, authorName: string, readerName: string, storyTitle: string, commentText: string, storyUrl: string) => {
    const html = `<p>${readerName} commented on ${storyTitle}</p>`;
    const result = await emailService.sendEmail({ to, subject: "New comment on your story", html });
    return result.success;
  },

  sendHireRequestNotificationEmail: async (to: string, writerName: string, clientName: string, projectType: string, budgetMin: number | null, budgetMax: number | null, expectedDeadline: string, description: string, acceptUrl: string) => {
    const html = `<p>New Hire Request from ${clientName}</p>`;
    const result = await emailService.sendEmail({ to, subject: "New Project Request - Writer's Thing", html });
    return result.success;
  },

  sendHireRequestAcceptedEmail: async (to: string, isToWriter: boolean, partnerName: string, partnerEmail: string, partnerPhone: string | null, projectType: string) => {
    const html = `<p>Hire Request Accepted</p>`;
    const result = await emailService.sendEmail({ to, subject: "Hire Request Accepted", html });
    return result.success;
  },

  sendNewsletterWelcomeEmail: async (to: string) => {
    const html = `<p>Welcome to the newsletter</p>`;
    const result = await emailService.sendEmail({ to, subject: "Welcome to Writer's Thing!", html });
    return result.success;
  },

  sendContactEmail: async (replyTo: string, name: string, message: string) => {
    const html = `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${replyTo}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `;
    const result = await emailService.sendEmail({ to: 'hello@writersthing.com', subject: `New Contact Message from ${name}`, html, from: defaultFrom });
    return result.success;
  },

  sendCareerEmail: async (replyTo: string, data: any, resumeBuffer?: Buffer, resumeName?: string, resumeType?: string) => {
    const html = `
          <h3>New Career Application</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${replyTo}</p>
          <p><strong>Mobile:</strong> ${data.mobile}</p>
          <p><strong>City:</strong> ${data.city}</p>
          <p><strong>Portfolio:</strong> ${data.portfolio || "N/A"}</p>
          <p><strong>Drive Link:</strong> <a href="${data.driveLink}">${data.driveLink}</a></p>
          <br/>
          <h4>About:</h4>
          <p>${data.about.replace(/\n/g, "<br>")}</p>
          <br/>
          <h4>Why Writer's Thing:</h4>
          <p>${data.why.replace(/\n/g, "<br>")}</p>
        `;
        
    const attachments = [];
    if (resumeBuffer && resumeName) {
      attachments.push({
        filename: resumeName,
        content: resumeBuffer,
      });
    }

    const result = await emailService.sendEmail({ 
      to: 'hello@writersthing.com', 
      subject: `New Career Application - ${data.name}`, 
      html, 
      from: defaultFrom,
      attachments
    });
    return result.success;
  }
};
