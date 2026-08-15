import { resend } from '../resend';
import * as React from 'react';
import { DynamicRecommendationEmail } from '@/emails/DynamicRecommendationEmail';
import { RecommendationEngineParams } from './types';

const DEFAULT_FROM = process.env.EMAIL_FROM || 'Writersthing <hello@writersthing.com>';

export type EmailResponse = { success: true; data: any } | { success: false; error: string };

export const dispatchRecommendationEmail = async ({
  to,
  subject,
  headerTitle,
  introText,
  blocks,
}: RecommendationEngineParams): Promise<EmailResponse> => {
  console.log(`[Recommendation Engine] Attempting to send email. To: ${to}, Subject: "${subject}"`);
  try {
    const response = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      react: React.createElement(DynamicRecommendationEmail, {
        previewText: subject,
        headerTitle,
        introText,
        blocks,
      }),
    });
    
    if (response.error) {
      console.error(`[Recommendation Engine] Resend API returned error for ${to}:`, response.error);
      return { success: false, error: response.error.message };
    }
    
    console.log(`[Recommendation Engine] Successfully sent email to ${to}. Response ID: ${response.data?.id}`);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[Recommendation Engine] Exception caught while sending email to ${to}:`, err);
    return { success: false, error: err.message || 'Unknown error occurred while sending email' };
  }
};
