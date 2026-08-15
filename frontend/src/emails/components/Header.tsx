import * as React from 'react';
import { Section } from '@react-email/components';
import { Logo } from './Logo';
import { Divider } from './Divider';

export const Header = () => {
  return (
    <Section className="mt-[24px]">
      <Logo />
      <Divider />
    </Section>
  );
};

export default Header;