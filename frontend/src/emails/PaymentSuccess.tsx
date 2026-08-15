// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface PaymentSuccessProps { amount: string;
} export default function PaymentSuccess({ amount ='$0.00' }: PaymentSuccessProps) { return ( <Layout previewText="Payment Successful" heading="Payment Confirmed"> <Text style={text}> Your payment of <strong>{amount}</strong> has been successfully processed. </Text> <Section style={btnContainer}> <Button style={button} href="https://writersthing.com/dashboard/billing"> View Details </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
