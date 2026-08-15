// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface BookPublishedProps { title: string;
} export default function BookPublished({ title ='Your Book' }: BookPublishedProps) { return ( <Layout previewText="Your book is now published!" heading="Book Published"> <Text style={text}> Congratulations! Your book <strong>{title}</strong> is now live and available to readers on Writersthing. </Text> <Section style={btnContainer}> <Button style={button} href="https://writersthing.com/dashboard/books"> View Your Book </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
