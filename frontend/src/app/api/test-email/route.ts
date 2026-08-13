import { NextResponse } from 'next/server';
import { emailService } from '@/services/email.service';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const response = await emailService.sendWelcomeEmail(email, 'Test User');

    if (response.success) {
      return NextResponse.json({ success: true, message: 'Welcome email sent successfully!', data: response.data }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: response.error }, { status: 500 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Test API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
