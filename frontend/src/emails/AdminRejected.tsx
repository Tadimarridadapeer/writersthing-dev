// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface AdminRejectedProps { requestName: string; reason: string;
} export default function AdminRejected({ requestName ='Your Request', reason ='Does not meet guidelines.' }: AdminRejectedProps) { return ( <Layout previewText="Update on your request" heading="Request Update"> <Text style={text}> We have reviewed <strong>{requestName}</strong>, but unfortunately, it cannot be approved at this time. </Text> <Section style={feedbackContainer}> <Text style={text}><strong>Reason:</strong> {reason}</Text> </Section> <Text style={text}> You can make changes and submit again from your dashboard. </Text> <Section style={btnContainer}> <Button style={button} href="https://writersthing.com/dashboard"> Review Details </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const feedbackContainer = { backgroundColor:'#fff0f0', borderLeft:'4px solid #ff4d4f', padding:'16px', margin:'24px 0',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
