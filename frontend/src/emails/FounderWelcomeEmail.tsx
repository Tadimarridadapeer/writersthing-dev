import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface FounderWelcomeEmailProps {
  name: string;
}

export const FounderWelcomeEmail = ({ name }: FounderWelcomeEmailProps) => {
  return (
    <EmailLayout previewText="A personal welcome from the founder" heading="Welcome to the family">
      <Text style={text}>
        Hey {name},
      </Text>
      <Text style={text}>
        I&apos;m thrilled to welcome you to Writersthing. I built this platform because I believe writers deserve a better place to share their stories and earn a living doing what they love.
      </Text>
      <Text style={text}>
        Our goal is simple: empower creators like you with the best tools, a beautiful reading experience, and a community that cares.
      </Text>
      <Text style={text}>
        If you ever have any feedback or just want to say hi, reply directly to this email. I read every single one.
      </Text>
      <Text style={text}>
        Write on,<br/>
        <strong>Founder, Writersthing</strong>
      </Text>
      
      <Section style={btnContainer}>
        <Button style={button} href="https://writersthing.com">
          Explore Writersthing
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

export default FounderWelcome;
