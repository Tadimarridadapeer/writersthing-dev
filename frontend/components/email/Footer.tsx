import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import SocialLinks from './SocialLinks';
import Divider from './Divider';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Section style={footerContainer}>
      <Divider margin="32px 0" />
      
      <SocialLinks />

      <Text style={footerText}>
        &copy; {currentYear} Writersthing. All rights reserved.
      </Text>
      
      <Text style={footerLinks}>
        <Link href="https://writersthing.com/privacy" style={link}>Privacy Policy</Link>
        {' • '}
        <Link href="https://writersthing.com/terms" style={link}>Terms</Link>
        {' • '}
        <Link href="mailto:support@writersthing.com" style={link}>support@writersthing.com</Link>
      </Text>
    </Section>
  );
}

const footerContainer = {
  textAlign: 'center' as const,
  padding: '0 20px 48px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0 8px',
};

const footerLinks = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};

const link = {
  color: '#8898aa',
  textDecoration: 'underline',
};
