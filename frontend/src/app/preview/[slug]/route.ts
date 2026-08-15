import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/components';
import * as React from 'react';

import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { ForgotPasswordEmail } from '@/emails/ForgotPasswordEmail';
import { OTPVerificationEmail } from '@/emails/OTPVerificationEmail';
import { PaymentSuccessEmail } from '@/emails/PaymentSuccessEmail';
import { PurchaseReceiptEmail } from '@/emails/PurchaseReceiptEmail';
import { FounderInviteEmail } from '@/emails/FounderInviteEmail';
import { AdminApprovalEmail } from '@/emails/AdminApprovalEmail';
import { AdminRejectedEmail } from '@/emails/AdminRejectedEmail';
import { DynamicRecommendationEmail } from '@/emails/DynamicRecommendationEmail';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  // Ensure this is only accessible in development
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Use default props (sample data) for all previews
  let EmailComponent: React.ReactElement | null = null;

  // Use default props (sample data) for all previews
  switch (slug) {
    case 'welcome':
      EmailComponent = React.createElement(WelcomeEmail);
      break;
    case 'reset-password':
      EmailComponent = React.createElement(ForgotPasswordEmail);
      break;
    case 'otp':
      EmailComponent = React.createElement(OTPVerificationEmail);
      break;
    case 'payment':
      EmailComponent = React.createElement(PaymentSuccessEmail);
      break;
    case 'receipt':
      EmailComponent = React.createElement(PurchaseReceiptEmail);
      break;
    case 'founder':
      EmailComponent = React.createElement(FounderInviteEmail);
      break;
    case 'approval':
      EmailComponent = React.createElement(AdminApprovalEmail);
      break;
    case 'rejection':
      EmailComponent = React.createElement(AdminRejectedEmail);
      break;
    case 'recommended-books':
      EmailComponent = React.createElement(DynamicRecommendationEmail, {
        headerTitle: 'Recommended Reading',
        introText: 'Based on your recent reads, we think you might love these handpicked selections.',
        blocks: [
          { type: 'book', data: { coverUrl: 'https://placehold.co/400x600/e2e8f0/1e293b?text=Book+Cover', title: 'The Echoes of Time', author: 'Eleanor Vance', description: 'A gripping tale of mystery and suspense.', ctaText: 'Read Now', ctaUrl: '#' } },
          { type: 'book', data: { coverUrl: 'https://placehold.co/400x600/e2e8f0/1e293b?text=Book+Cover', title: 'Winds of Change', author: 'Marcus Aurelius', description: 'A profound exploration of the human spirit.', ctaText: 'Read Now', ctaUrl: '#' } }
        ]
      });
      break;
    case 'trending':
      EmailComponent = React.createElement(DynamicRecommendationEmail, {
        headerTitle: 'Trending Books',
        introText: 'Discover what everyone is talking about this week.',
        blocks: [
          { type: 'book', data: { coverUrl: 'https://placehold.co/400x600/e2e8f0/1e293b?text=Book+Cover', title: 'The Silent Observer', author: 'John Doe', description: 'The #1 most read thriller on Writersthing this week.', ctaText: 'View Book', ctaUrl: '#' } }
        ]
      });
      break;
    case 'continue-reading':
      EmailComponent = React.createElement(DynamicRecommendationEmail, {
        headerTitle: 'Continue Reading',
        introText: 'You left off at Chapter 4. Dive back into the story!',
        blocks: [
          { type: 'book', data: { coverUrl: 'https://placehold.co/400x600/e2e8f0/1e293b?text=Book+Cover', title: 'Journey to the Center', author: 'Jane Smith', description: 'You are 40% through this epic adventure.', ctaText: 'Resume Reading', ctaUrl: '#' } }
        ]
      });
      break;
    case 'weekly-digest':
      EmailComponent = React.createElement(DynamicRecommendationEmail, {
        headerTitle: 'Weekly Digest',
        introText: 'Here is your personalized summary of the best content on Writersthing from the past week.',
        blocks: [
          { type: 'author', data: { avatarUrl: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Author', name: 'Sarah Jenkins', bio: 'Top trending author of the week, known for her captivating sci-fi series.', ctaText: 'View Profile', ctaUrl: '#' } },
          { type: 'book', data: { coverUrl: 'https://placehold.co/400x600/e2e8f0/1e293b?text=Book+Cover', title: 'Neon Gods', author: 'Sarah Jenkins', description: 'Her latest release is taking the community by storm.', ctaText: 'Read Book', ctaUrl: '#' } }
        ]
      });
      break;
    case 'author-updates':
      EmailComponent = React.createElement(DynamicRecommendationEmail, {
        headerTitle: 'Author Updates',
        introText: 'Authors you follow have published new content.',
        blocks: [
          { type: 'author', data: { avatarUrl: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Author', name: 'David Wallace', bio: 'David just published a new article about his writing process.', ctaText: 'Read Article', ctaUrl: '#' } }
        ]
      });
      break;
    case 'new-release':
      EmailComponent = React.createElement(DynamicRecommendationEmail, {
        headerTitle: 'New Release',
        introText: 'Based on your interest in Fantasy, we think you will love this highly anticipated new release.',
        blocks: [
          { type: 'book', data: { coverUrl: 'https://placehold.co/400x600/e2e8f0/1e293b?text=Book+Cover', title: 'The Final Empire', author: 'Brandon', description: 'The spectacular conclusion to the epic saga.', ctaText: 'Read Now', ctaUrl: '#' } }
        ]
      });
      break;
    default:
      return new NextResponse('Preview route not found', { status: 404 });
  }

  try {
    // Render the React component into an HTML string
    const html = await render(EmailComponent);
    
    // Return the raw HTML string exactly as it will appear in email clients
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error rendering email template:', error);
    return new NextResponse('Error rendering email template', { status: 500 });
  }
}
