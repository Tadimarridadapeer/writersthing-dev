// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface ForgotPasswordProps { resetLink: string;
} export default function ForgotPassword({ resetLink ='https://writersthing.com/reset' }: ForgotPasswordProps) { return ( <Layout previewText="Reset your password" heading="Password Reset Request"> <Text style={text}> We received a request to reset your password. Click the button below to choose a new one. </Text> <Section style={btnContainer}> <Button style={button} href={resetLink}> Reset Password </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
