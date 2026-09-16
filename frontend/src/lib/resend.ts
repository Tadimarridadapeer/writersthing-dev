import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not defined in the environment variables');
}
// Pass a dummy key if missing to prevent Next.js build from crashing during static evaluation
export const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_prevent_build_crash');
