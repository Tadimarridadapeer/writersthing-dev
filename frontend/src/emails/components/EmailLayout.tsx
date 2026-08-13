import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  previewText?: string;
  heading?: string;
  children: React.ReactNode;
}

export const EmailLayout = ({
  previewText,
  heading,
  children,
}: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://writersthing.com/logo.png" // Fallback or proper logo URL needed
              width="40"
              height="40"
              alt="Writersthing Logo"
              style={logo}
            />
            <Heading style={headerTitle}>Writersthing</Heading>
          </Section>
          
          <Hr style={hr} />

          <Section style={content}>
            {heading && <Heading style={h1}>{heading}</Heading>}
            {children}
          </Section>
          
          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              Need help? Contact us at <Link href="mailto:hello@writersthing.com" style={footerLink}>hello@writersthing.com</Link>
            </Text>
            <Text style={footerLinks}>
              <Link href="https://writersthing.com/twitter" style={footerLink}>Twitter</Link> •{' '}
              <Link href="https://writersthing.com/instagram" style={footerLink}>Instagram</Link> •{' '}
              <Link href="https://writersthing.com/linkedin" style={footerLink}>LinkedIn</Link>
            </Text>
            <Text style={copyright}>
              © {new Date().getFullYear()} Writersthing. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styling
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid #eaeaea',
  maxWidth: '600px',
};

const header = {
  padding: '20px 40px',
  textAlign: 'center' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const logo = {
  marginRight: '12px',
  display: 'inline-block',
  verticalAlign: 'middle',
};

const headerTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#000000',
  margin: '0',
  display: 'inline-block',
  verticalAlign: 'middle',
};

const content = {
  padding: '20px 40px',
};

const h1 = {
  color: '#000000',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
};

const hr = {
  borderColor: '#eaeaea',
  margin: '0',
};

const footer = {
  padding: '30px 40px 10px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 10px',
};

const footerLinks = {
  color: '#666666',
  fontSize: '14px',
  margin: '0 0 20px',
};

const footerLink = {
  color: '#000000',
  textDecoration: 'underline',
};

const copyright = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};
