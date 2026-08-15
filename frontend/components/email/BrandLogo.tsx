import * as React from 'react';
import { Img, Link } from '@react-email/components';

export default function BrandLogo() {
  return (
    <Link href="https://writersthing.com">
      <Img
        src="https://writersthing.com/logo.png"
        alt="Writersthing Logo"
        width="160"
        height="auto"
        style={logo}
      />
    </Link>
  );
}

const logo = {
  display: 'block',
  margin: '0 auto',
};
