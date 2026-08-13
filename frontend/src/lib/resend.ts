import { Resend } from 'resend';

// Initialize the Resend client
// The API key should be stored in the .env file as RESEND_API_KEY
export const resend = new Resend(process.env.RESEND_API_KEY);
