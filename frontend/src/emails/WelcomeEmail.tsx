import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  return (
    <EmailLayout previewText="Welcome to Writersthing!" heading={`Welcome, ${name}!`}>
      <Text style={text}>
        We are thrilled to have you join our community. Writersthing is the best place to read, write, and connect with other writers.
      </Text>
      <Text style={text}>
        To get started, check out the latest stories or publish your first piece today.
      </Text>
      <Section style={btnContainer}>
        <Button style={button} href="https://writersthing.com/dashboard">
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

export default WelcomeEmail;
