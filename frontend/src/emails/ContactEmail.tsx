// @ts-nocheck
import { Text, Section } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface ContactEmailProps { name: string; email: string; message: string;
} export default function ContactEmail({ name ='John Doe', email ='john@example.com', message ='Hello!' }: ContactEmailProps) { return ( <Layout previewText={`New Contact Message from ${name}`} heading="New Contact Request"> <Text style={text}> You have received a new contact message. </Text> <Section style={dataContainer}> <Text style={text}><strong>Name:</strong> {name}</Text> <Text style={text}><strong>Email:</strong> {email}</Text> <Text style={text}><strong>Message:</strong></Text> <Text style={text}>{message}</Text> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px', margin:'0 0 8px',
}; const dataContainer = { backgroundColor:'#f9fafb', padding:'16px', borderRadius:'8px', margin:'24px 0',
};
