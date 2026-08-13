import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface WriterSaleNotificationProps {
  writerName: string;
  bookTitle: string;
  buyerName: string;
  amountEarned: string;
}

export const WriterSaleNotification = ({ writerName, bookTitle, buyerName, amountEarned }: WriterSaleNotificationProps) => {
  return (
    <EmailLayout previewText="You just made a sale!" heading="Cha-ching! New Sale">
      <Text style={text}>
        Congratulations {writerName}!
      </Text>
      <Text style={text}>
        <strong>{buyerName}</strong> just purchased your book <strong>{bookTitle}</strong>.
      </Text>
      <Section style={statsContainer}>
        <Text style={statsLabel}>You earned</Text>
        <Text style={statsValue}>{amountEarned}</Text>
      </Section>
      <Text style={text}>
        Keep up the great work! Your audience is growing and your stories are making an impact.
      </Text>
      <Section style={btnContainer}>
        <Button style={button} href="https://writersthing.com/dashboard/sales">
          View Sales Dashboard
        </Button>
      </Section>
    </EmailLayout>
  );
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const statsContainer = {
  backgroundColor: '#f9fafb',
  border: '1px solid #eaeaea',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const statsLabel = {
  margin: '0 0 8px',
  color: '#666',
  fontSize: '14px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const statsValue = {
  margin: '0',
  color: '#000',
  fontSize: '32px',
  fontWeight: 'bold',
};

const btnContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default WriterSaleNotification;
