import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface ForgotPasswordEmailProps {
  name: string;
  resetLink: string;
}

export const ForgotPasswordEmail = ({ name, resetLink }: ForgotPasswordEmailProps) => {
  return (
    <EmailLayout previewText="Reset your Writersthing password" heading="Reset Password">
      <Text style={text}>
        Hi {name},
      </Text>
      <Text style={text}>
        We received a request to reset your password. If you didn&apos;t make this request, you can safely ignore this email.
      </Text>
      <Text style={text}>
        Otherwise, click the button below to set a new password:
      </Text>
      <Section style={btnContainer}>
        <Button style={button} href={resetLink}>
          Reset Password
        </Button>
      </Section>
      <Text style={text}>
        Or copy and paste this link into your browser: <br />
        <a href={resetLink} style={link}>{resetLink}</a>
      </Text>
    </EmailLayout>
  );
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const link = {
  color: '#000000',
  textDecoration: 'underline',
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

export default ForgotPasswordEmail;
