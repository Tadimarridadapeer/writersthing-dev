import * as React from 'react';
import { Row, Column, Link, Img } from '@react-email/components';

export default function SocialLinks() {
  return (
    <Row style={socialLinksRow}>
      <Column align="center" style={iconColumn}>
        <Link href="https://twitter.com/writersthing" style={link}>
          {/* Placeholder for X/Twitter icon */}
          <Img src="https://writersthing.com/icons/twitter.png" width="24" height="24" alt="Twitter" />
        </Link>
      </Column>
      <Column align="center" style={iconColumn}>
        <Link href="https://instagram.com/writersthing" style={link}>
          {/* Placeholder for Instagram icon */}
          <Img src="https://writersthing.com/icons/instagram.png" width="24" height="24" alt="Instagram" />
        </Link>
      </Column>
      <Column align="center" style={iconColumn}>
        <Link href="https://linkedin.com/company/writersthing" style={link}>
          {/* Placeholder for LinkedIn icon */}
          <Img src="https://writersthing.com/icons/linkedin.png" width="24" height="24" alt="LinkedIn" />
        </Link>
      </Column>
    </Row>
  );
}

const socialLinksRow = {
  width: '120px',
  margin: '0 auto',
};

const iconColumn = {
  padding: '0 8px',
};

const link = {
  display: 'inline-block',
};
