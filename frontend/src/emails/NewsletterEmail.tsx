// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { EmailLayout } from'./layouts/BaseLayout'; interface NewsletterEmailProps { name: string; subject: string; content: string; // HTML string or plain text ctaText?: string; ctaUrl?: string;
} export const NewsletterEmail = ({ name, subject, content, ctaText, ctaUrl }: NewsletterEmailProps) => { return ( <EmailLayout previewText={subject} heading={subject}> <Text style={text}> Hi {name}, </Text> <Section> {/* If content is complex HTML, dangerouslySetInnerHTML could be used in a real app, but for React Email we can just render the text or basic formatting */} <Text style={text} dangerouslySetInnerHTML={{ __html: content }} /> </Section> {ctaText && ctaUrl && ( <Section style={btnContainer}> <Button style={button} href={ctaUrl}> {ctaText} </Button> </Section> )} </EmailLayout> );
}; const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
}; export default NewsletterEmail;
