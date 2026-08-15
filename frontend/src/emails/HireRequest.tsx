// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface HireRequestProps { writerName: string; clientName: string; projectType: string; description: string;
} export default function HireRequest({ writerName ='Writer', clientName ='A Client', projectType ='Project', description ='Project details' }: HireRequestProps) { return ( <Layout previewText="You have a new hire request!" heading="New Hire Request"> <Text style={text}> Hey {writerName}, </Text> <Text style={text}> <strong>{clientName}</strong> has requested to hire you for a <strong>{projectType}</strong> project. </Text> <Section style={dataContainer}> <Text style={text}><strong>Description:</strong></Text> <Text style={text}>{description}</Text> </Section> <Section style={btnContainer}> <Button style={button} href="https://writersthing.com/dashboard/requests"> Review Request </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px', margin:'0 0 8px',
}; const dataContainer = { backgroundColor:'#f9fafb', padding:'16px', borderRadius:'8px', margin:'24px 0',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
