import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface BookApprovedEmailProps {
  authorName: string;
  bookTitle: string;
  bookUrl: string;
}

export const BookApprovedEmail = ({ authorName, bookTitle, bookUrl }: BookApprovedEmailProps) => {
  return (
    <EmailLayout previewText={`Great news! ${bookTitle} is approved`} heading="Your Book is Live!">
      <Text style={text}>
        Hi {authorName},
      </Text>
      <Text style={text}>
        Great news! Your book <strong>{bookTitle}</strong> has passed our quality review and is now live on Writersthing.
      </Text>
      <Text style={text}>
        Readers can now discover, purchase, and read your work. Share the link with your audience to start driving sales!
      </Text>
      <Section style={btnContainer}>
        <Button style={button} href={bookUrl}>
          View Your Book
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

export default BookApprovedEmail;
