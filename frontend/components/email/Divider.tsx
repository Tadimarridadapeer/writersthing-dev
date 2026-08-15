import * as React from 'react';
import { Hr } from '@react-email/components';

interface DividerProps {
  margin?: string;
}

export default function Divider({ margin = '32px 0' }: DividerProps) {
  return (
    <Hr
      style={{
        borderColor: '#eaeaea',
        margin: margin,
        borderWidth: '1px',
      }}
    />
  );
}
