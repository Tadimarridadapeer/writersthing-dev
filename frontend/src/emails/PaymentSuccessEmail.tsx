import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface PaymentSuccessEmailProps {
  name: string;
  amount: string;
  transactionId: string;
}

export const PaymentSuccessEmail = ({ name, amount, transactionId }: PaymentSuccessEmailProps) => {
  return (
    <EmailLayout previewText="Payment Successful" heading="Payment Successful">
      <Text style={text}>
        Hi {name},
      </Text>
      <Text style={text}>
        We have successfully processed your payment of <strong>{amount}</strong>. Thank you for your purchase!
      </Text>
      <Text style={text}>
        Transaction ID: {transactionId}
      </Text>
      <Section style={btnContainer}>
        <Button style={button} href="https://writersthing.com/dashboard/billing">
          View Billing History
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

export default PaymentSuccessEmail;
