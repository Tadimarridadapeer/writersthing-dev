import { NextResponse } from 'next/server';
import { 
  sendWelcomeEmail, 
  sendOTPEmail, 
  sendForgotPasswordEmail, 
  sendPaymentSuccessEmail, 
  sendPurchaseReceipt, 
  sendFounderInviteEmail, 
  sendAdminApprovalEmail, 
  sendAdminRejectedEmail 
} from '@/lib/email';

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email, template } = await req.json();

    if (!email || !template) {
      return NextResponse.json({ error: 'Email and template are required' }, { status: 400 });
    }

    let result;

    switch (template) {
      case 'welcome':
        result = await sendWelcomeEmail(email, 'Test User');
        break;
      case 'otp':
        result = await sendOTPEmail(email, '123456');
        break;
      case 'forgot-password':
        result = await sendForgotPasswordEmail(email, 'https://writersthing.com/reset?token=test');
        break;
      case 'payment':
        result = await sendPaymentSuccessEmail(email, '99.00');
        break;
      case 'receipt':
        result = await sendPurchaseReceipt(email, 'The Great Test Book', '29.00');
        break;
      case 'founder-invite':
        result = await sendFounderInviteEmail(email, 'https://writersthing.com/invite?token=test');
        break;
      case 'approval':
        result = await sendAdminApprovalEmail(email, 'Test Writer');
        break;
      case 'rejected':
        result = await sendAdminRejectedEmail(email, 'Test Writer', 'Your portfolio does not meet our current requirements.');
        break;
      default:
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      data: result.success ? result.data : undefined,
      error: !result.success ? result.error : undefined,
    });
  } catch (error: any) {
    console.error('Test email route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
