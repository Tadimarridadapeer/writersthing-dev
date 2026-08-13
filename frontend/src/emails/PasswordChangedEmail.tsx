import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface PasswordChangedEmailProps {
  name: string;
}

export const PasswordChangedEmail = ({ name }: PasswordChangedEmailProps) => {
  return (
    <EmailLayout previewText="Your password was reset successfully" heading="Password Changed">
      <Text style={text}>
        Hi {name},
      </Text>
      <Text style={text}>
        Your password has been successfully reset. You can now log in using your new credentials.
      </Text>
      <Text style={text}>
        If you did not perform this action, please contact support immediately to secure your account.
      </Text>
      <Section style={btnContainer}>
        <Button style={button} href="https://writersthing.com/login">
          Log In Now
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

export default ResetPasswordEmail;
