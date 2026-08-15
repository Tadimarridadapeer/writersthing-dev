// @ts-nocheck
import { Text, Section } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface HireRejectedProps { clientName: string; writerName: string;
} export default function HireRejected({ clientName ='Client', writerName ='Writer' }: HireRejectedProps) { return ( <Layout previewText="Update on your hire request" heading="Request Declined"> <Text style={text}> Hi {clientName}, </Text> <Text style={text}> Unfortunately, <strong>{writerName}</strong> has declined your hire request at this time. </Text> <Text style={text}> They might be fully booked or the project might not be a good fit right now. We encourage you to browse our directory to find another talented writer for your project! </Text> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px', margin:'0 0 8px',
};
