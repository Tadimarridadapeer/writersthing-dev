// @ts-nocheck
import { Text, Section } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface OTPVerificationProps { otp: string;
} export default function OTPVerification({ otp ='123456' }: OTPVerificationProps) { return ( <Layout previewText="Your verification code" heading="Verify Your Identity"> <Text style={text}> Please use the following verification code to complete your request: </Text> <Section style={otpContainer}> <Text style={otpCode}>{otp}</Text> </Section> <Text style={text}> If you did not request this code, please ignore this email. </Text> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const otpContainer = { textAlign:'center' as const, margin:'24px 0',
}; const otpCode = { fontSize:'32px', fontWeight:'bold', letterSpacing:'8px', color:'#000000', margin:'0',
};
