import { resend } from '@/lib/resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { ForgotPasswordEmail } from '@/emails/ForgotPasswordEmail';
import { PasswordChangedEmail } from '@/emails/PasswordChangedEmail';
import { PaymentSuccessEmail } from '@/emails/PaymentSuccessEmail';
import { PurchaseReceiptEmail } from '@/emails/PurchaseReceiptEmail';
import { WriterSaleNotification } from '@/emails/WriterSaleNotification';
import { BookApprovedEmail } from '@/emails/BookApprovedEmail';
import { BookRejectedEmail } from '@/emails/BookRejectedEmail';
import { NewsletterEmail } from '@/emails/NewsletterEmail';
import { FounderWelcomeEmail } from '@/emails/FounderWelcomeEmail';
import * as React from 'react';

const defaultFrom = process.env.EMAIL_FROM || 'hello@writersthing.com';

type EmailResponse = { success: true; data?: any } | { success: false; error: string };

export const emailService = {
  sendEmail: async (options: { to: string; subject: string; html?: string; react?: React.ReactElement; from?: string }): Promise<EmailResponse> => {
    try {
      const data = await resend.emails.send({
        from: options.from || defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        react: options.react,
      });
      return { success: true, data };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  },

  sendWelcomeEmail: async (to: string, name: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: 'Welcome to Writersthing!',
      react: React.createElement(WelcomeEmail, { name }),
    });
  },

  sendForgotPasswordEmail: async (to: string, name: string, resetLink: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: 'Reset your password',
      react: React.createElement(ForgotPasswordEmail, { name, resetLink }),
    });
  },

  sendPasswordChangedEmail: async (to: string, name: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: 'Your password was changed',
      react: React.createElement(PasswordChangedEmail, { name }),
    });
  },

  sendPaymentSuccessEmail: async (to: string, name: string, amount: string, transactionId: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: 'Payment Successful',
      react: React.createElement(PaymentSuccessEmail, { name, amount, transactionId }),
    });
  },

  sendPurchaseReceiptEmail: async (to: string, name: string, bookTitle: string, authorName: string, amount: string, readLink: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: `Your receipt for ${bookTitle}`,
      react: React.createElement(PurchaseReceiptEmail, { name, bookTitle, authorName, amount, readLink }),
    });
  },

  sendWriterSaleNotification: async (to: string, writerName: string, bookTitle: string, buyerName: string, amountEarned: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: 'You made a new sale!',
      react: React.createElement(WriterSaleNotification, { writerName, bookTitle, buyerName, amountEarned }),
    });
  },

  sendBookApprovedEmail: async (to: string, authorName: string, bookTitle: string, bookUrl: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: 'Your book is live!',
      react: React.createElement(BookApprovedEmail, { authorName, bookTitle, bookUrl }),
    });
  },

  sendBookRejectedEmail: async (to: string, authorName: string, bookTitle: string, feedback: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: 'Update on your book submission',
      react: React.createElement(BookRejectedEmail, { authorName, bookTitle, feedback }),
    });
  },

  sendFounderWelcomeEmail: async (to: string, name: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject: 'Welcome to Writersthing',
      react: React.createElement(FounderWelcomeEmail, { name }),
    });
  },

  sendNewsletterEmail: async (to: string, name: string, subject: string, content: string, ctaText?: string, ctaUrl?: string): Promise<EmailResponse> => {
    return emailService.sendEmail({
      to,
      subject,
      react: React.createElement(NewsletterEmail, { name, subject, content, ctaText, ctaUrl }),
    });
  },

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
    const result = await emailService.sendEmail({ to: 'hello@writersthing.com', subject: `New Career Application - ${data.name}`, html, from: defaultFrom });
    return result.success;
  }
};
