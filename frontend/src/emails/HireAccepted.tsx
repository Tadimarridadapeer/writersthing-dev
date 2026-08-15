// @ts-nocheck
import { Text, Section } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface HireAcceptedProps { clientName: string; writerName: string; writerEmail: string;
} export default function HireAccepted({ clientName ='Client', writerName ='Writer', writerEmail ='writer@example.com' }: HireAcceptedProps) { return ( <Layout previewText="Your hire request was accepted!" heading="Request Accepted!"> <Text style={text}> Hi {clientName}, </Text> <Text style={text}> Great news! <strong>{writerName}</strong> has accepted your hire request. </Text> <Text style={text}> You can now communicate directly with them to get started on your project. </Text> <Section style={dataContainer}> <Text style={text}><strong>Writer's Email:</strong> {writerEmail}</Text> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px', margin:'0 0 8px',
}; const dataContainer = { backgroundColor:'#f9fafb', padding:'16px', borderRadius:'8px', margin:'24px 0',
};
