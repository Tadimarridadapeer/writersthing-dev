import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface BookRejectedEmailProps {
  authorName: string;
  bookTitle: string;
  feedback: string;
}

export const BookRejectedEmail = ({ authorName, bookTitle, feedback }: BookRejectedEmailProps) => {
  return (
    <EmailLayout previewText={`Update on your submission: ${bookTitle}`} heading="Submission Update">
      <Text style={text}>
        Hi {authorName},
      </Text>
      <Text style={text}>
        Thank you for submitting <strong>{bookTitle}</strong> to Writersthing. After careful review, our team has decided that it requires some revisions before it can be published.
      </Text>
      
      <Section style={feedbackContainer}>
        <Text style={feedbackTitle}>Reviewer Feedback:</Text>
        <Text style={feedbackText}>{feedback}</Text>
      </Section>

      <Text style={text}>
        Don&apos;t be discouraged! You can update your manuscript based on this feedback and resubmit it from your dashboard.
      </Text>
      
      <Section style={btnContainer}>
        <Button style={button} href="https://writersthing.com/dashboard/submissions">
          Go to Dashboard
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

const feedbackContainer = {
  backgroundColor: '#fff0f0',
  borderLeft: '4px solid #ff4d4f',
  padding: '16px',
  margin: '24px 0',
};

const feedbackTitle = {
  margin: '0 0 8px',
  fontWeight: 'bold',
  color: '#333',
};

const feedbackText = {
  margin: '0',
  color: '#333',
  fontStyle: 'italic',
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

export default BookRejectedEmail;
