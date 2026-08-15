// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface AdminApprovalProps { requestName: string;
} export default function AdminApproval({ requestName ='Your Request' }: AdminApprovalProps) { return ( <Layout previewText="Your request has been approved" heading="Request Approved"> <Text style={text}> Good news! <strong>{requestName}</strong> has been reviewed and approved by our admin team. </Text> <Section style={btnContainer}> <Button style={button} href="https://writersthing.com/dashboard"> Go to Dashboard </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
