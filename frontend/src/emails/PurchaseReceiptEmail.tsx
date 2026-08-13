import { Button, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface PurchaseReceiptEmailProps {
  name: string;
  bookTitle: string;
  authorName: string;
  amount: string;
  readLink: string;
}

export const PurchaseReceiptEmail = ({ name, bookTitle, authorName, amount, readLink }: PurchaseReceiptEmailProps) => {
  return (
    <EmailLayout previewText={`Your receipt for ${bookTitle}`} heading="Purchase Receipt">
      <Text style={text}>
        Hi {name},
      </Text>
      <Text style={text}>
        Thank you for purchasing <strong>{bookTitle}</strong> by {authorName}. Your support means the world to our writers!
      </Text>
      
      <Section style={receiptContainer}>
        <Text style={receiptRow}>
          <span>Item</span>
          <span>{bookTitle}</span>
        </Text>
        <Hr style={hr} />
        <Text style={receiptRowTotal}>
          <span>Total</span>
          <span>{amount}</span>
        </Text>
      </Section>

      <Text style={text}>
        You can start reading your new book right away.
      </Text>

      <Section style={btnContainer}>
        <Button style={button} href={readLink}>
          Read Now
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

const receiptContainer = {
  backgroundColor: '#f9fafb',
  border: '1px solid #eaeaea',
  borderRadius: '4px',
  padding: '20px',
  margin: '20px 0',
};

const receiptRow = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '0 0 10px',
  color: '#333',
  fontSize: '16px',
};

const receiptRowTotal = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '10px 0 0',
  color: '#000',
  fontSize: '18px',
  fontWeight: 'bold',
};

const hr = {
  borderColor: '#eaeaea',
  margin: '10px 0',
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

export default BookPurchaseReceipt;
