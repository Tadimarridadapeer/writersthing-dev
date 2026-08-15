// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface WriterSaleNotificationProps { writerName: string; bookTitle: string; amount: string;
} export default function WriterSaleNotification({ writerName ='Writer', bookTitle ='Your Book', amount ='$0.00' }: WriterSaleNotificationProps) { return ( <Layout previewText="You made a sale!" heading="Cha-ching! 💸"> <Text style={text}> Hey {writerName}, </Text> <Text style={text}> Great news! Someone just purchased a copy of <strong>{bookTitle}</strong>. </Text> <Section style={receiptContainer}> <Text style={text}><strong>Earnings from this sale:</strong> {amount}</Text> </Section> <Section style={btnContainer}> <Button style={button} href="https://writersthing.com/dashboard/sales"> View Sales Dashboard </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px', margin:'0 0 8px',
}; const receiptContainer = { backgroundColor:'#f9fafb', padding:'16px', borderRadius:'8px', margin:'24px 0',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
