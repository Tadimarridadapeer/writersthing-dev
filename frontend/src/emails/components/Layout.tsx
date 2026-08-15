import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from'@react-email/components';
import * as React from'react'; interface LayoutProps { previewText?: string; heading?: string; children: React.ReactNode;
} export const Layout = ({ previewText, heading, children }: LayoutProps) => { return ( <Html> <Head /> {previewText && <Preview>{previewText}</Preview>} <Body style={main}> <Container style={container}> <Section style={header}> <Heading style={headerTitle}>Writersthing</Heading> </Section> <Hr style={hr} /> <Section style={content}> {heading && <Heading style={h1}>{heading}</Heading>} {children} </Section> <Hr style={hr} /> <Section style={footer}> <Text style={footerText}> Writersthing - The best place for writers. </Text> </Section> </Container> </Body> </Html> );
}; const main = { backgroundColor:'#f6f9fc', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}; const container = { backgroundColor:'#ffffff', margin:'0 auto', padding:'20px 0 48px', marginBottom:'64px', borderRadius:'8px', overflow:'hidden', border:'1px solid #eaeaea', maxWidth:'600px',
}; const header = { padding:'20px 40px', textAlign:'center' as const,
}; const headerTitle = { fontSize:'24px', fontWeight:'700', color:'#000000', margin:'0',
}; const content = { padding:'20px 40px',
}; const h1 = { color:'#000000', fontSize:'24px', fontWeight:'600', lineHeight:'40px', margin:'0 0 20px',
}; const hr = { borderColor:'#eaeaea', margin:'0',
}; const footer = { padding:'30px 40px 10px', textAlign:'center' as const,
}; const footerText = { color:'#666666', fontSize:'14px', lineHeight:'24px', margin:'0',
}; export default Layout;
