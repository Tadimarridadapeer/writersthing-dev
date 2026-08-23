import { resend } from './resend';
import { WelcomeEmail } from '../emails/WelcomeEmail';
import { ForgotPasswordEmail } from '../emails/ForgotPasswordEmail';
import { OTPVerificationEmail } from '../emails/OTPVerificationEmail';
import { PaymentSuccessEmail } from '../emails/PaymentSuccessEmail';
import { PurchaseReceiptEmail } from '../emails/PurchaseReceiptEmail';
import { FounderInviteEmail } from '../emails/FounderInviteEmail';
import { AdminApprovalEmail } from '../emails/AdminApprovalEmail';
import { AdminRejectedEmail } from '../emails/AdminRejectedEmail';

import BookPublished from '../emails/BookPublished';
import Newsletter from '../emails/Newsletter';
import WriterSaleNotification from '../emails/WriterSaleNotification';
import ContactEmail from '../emails/ContactEmail';
import HireRequest from '../emails/HireRequest';
import HireAccepted from '../emails/HireAccepted';
import HireRejected from '../emails/HireRejected';

import * as React from 'react';
import { render } from '@react-email/render';

const DEFAULT_FROM = process.env.EMAIL_FROM || 'Writersthing <hello@writersthing.com>';

export type EmailResponse = { success: true; data: any } | { success: false; error: string };

const sendEmail = async (
  to: string | string[],
  subject: string,
  reactComponent: React.ReactElement
): Promise<EmailResponse> => {
  console.log(`[Email Service] Attempting to send email. To: ${to}, Subject: "${subject}"`);
  try {
    const htmlString = await render(reactComponent);
    
    const response = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html: htmlString,
    });
    
    if (response.error) {
      console.error(`[Email Service] Resend API returned error for ${to}:`, response.error);
      return { success: false, error: response.error.message };
    }
    
    console.log(`[Email Service] Successfully sent email to ${to}. Response ID: ${response.data?.id}`);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[Email Service] Exception caught while sending email to ${to}:`, err);
    return { success: false, error: err.message || 'Unknown error occurred while sending email' };
  }
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Welcome to Writersthing!', React.createElement(WelcomeEmail, { name }));
};

export const sendForgotPasswordEmail = async (to: string, resetLink: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Reset Your Password', React.createElement(ForgotPasswordEmail, { resetUrl: resetLink }));
};

export const sendOTPEmail = async (to: string, otp: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Your Verification Code', React.createElement(OTPVerificationEmail, { otp }));
};

export const sendPaymentSuccessEmail = async (to: string, amount: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Payment Successful', React.createElement(PaymentSuccessEmail, { amount }));
};

export const sendPurchaseReceipt = async (to: string, itemName: string, total: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Your Purchase Receipt', React.createElement(PurchaseReceiptEmail, { bookTitle: itemName, amount: total }));
};

export const sendAdminApprovalEmail = async (to: string, requestName: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Your Request Has Been Approved', React.createElement(AdminApprovalEmail, { name: requestName }));
};

export const sendAdminRejectedEmail = async (to: string, requestName: string, reason: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Update on Your Request', React.createElement(AdminRejectedEmail, { name: requestName, reason }));
};

export const sendFounderInviteEmail = async (to: string, inviteeName: string): Promise<EmailResponse> => {
  return sendEmail(to, "You've been invited to Writersthing!", React.createElement(FounderInviteEmail, { name: inviteeName }));
};

// Retained existing functions to prevent breaking other API routes
export const sendBookPublishedEmail = async (to: string, title: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Your Book is Now Published!', React.createElement(BookPublished, { title }));
};

export const sendNewsletter = async (to: string | string[], subject: string, content: string): Promise<EmailResponse> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://writersthing.com';
  const readMoreUrl = `${appUrl}/marketplace`;
  return sendEmail(to, subject, React.createElement(Newsletter, { subject, content, readMoreUrl }));
};

export const sendWriterSaleNotification = async (to: string, writerName: string, bookTitle: string, amount: string): Promise<EmailResponse> => {
  return sendEmail(to, 'You made a new sale! 💸', React.createElement(WriterSaleNotification, { writerName, bookTitle, amount }));
};

export const sendContactEmail = async (name: string, email: string, message: string): Promise<EmailResponse> => {
  return sendEmail('contact@writersthing.com', `New Contact Request from ${name}`, React.createElement(ContactEmail, { name, email, message }));
};

export const sendHireRequestEmail = async (to: string, writerName: string, clientName: string, projectType: string, description: string): Promise<EmailResponse> => {
  return sendEmail(to, 'New Hire Request - Writersthing', React.createElement(HireRequest, { writerName, clientName, projectType, description }));
};

export const sendHireAcceptedEmail = async (to: string, clientName: string, writerName: string, writerEmail: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Your Hire Request was Accepted!', React.createElement(HireAccepted, { clientName, writerName, writerEmail }));
};

export const sendHireRejectedEmail = async (to: string, clientName: string, writerName: string): Promise<EmailResponse> => {
  return sendEmail(to, 'Update on your Hire Request', React.createElement(HireRejected, { clientName, writerName }));
};
