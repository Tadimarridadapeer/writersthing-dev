import * as React from 'react';
import { Section } from '@react-email/components';
import BrandLogo from './BrandLogo';
import Divider from './Divider';

export default function Header() {
  return (
    <>
      <Section style={headerContainer}>
        <BrandLogo />
      </Section>
      <Divider margin="0 0 32px 0" />
    </>
  );
}

const headerContainer = {
  padding: '32px 0 24px',
  textAlign: 'center' as const,
};
