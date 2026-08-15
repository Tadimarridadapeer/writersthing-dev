// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface FounderInviteProps { inviteeName: string;
} export default function FounderInvite({ inviteeName ='Friend' }: FounderInviteProps) { return ( <Layout previewText="You've been invited!" heading="An Invitation for You"> <Text style={text}> Hey {inviteeName}, </Text> <Text style={text}> I am excited to personally invite you to join Writersthing. We are building the best platform for writers to publish and grow their audience. </Text> <Section style={btnContainer}> <Button style={button} href="https://writersthing.com/invite/accept"> Accept Invitation </Button> </Section> <Text style={text}> Looking forward to seeing what you write! </Text> <Text style={text}> - The Founder </Text> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
