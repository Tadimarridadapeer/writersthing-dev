// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; 
interface NewsletterProps { 
  subject: string; 
  content: string;
  readMoreUrl?: string;
} 
export default function Newsletter({ 
  subject ='Your Weekly Update', 
  content ='Here is the latest news from Writersthing.',
  readMoreUrl = 'https://writersthing.com/marketplace'
}: NewsletterProps) { return ( <Layout previewText={subject} heading={subject}> <Text style={text}> {content} </Text> <Section style={btnContainer}> <Button style={button} href={readMoreUrl}> Read More Online </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
