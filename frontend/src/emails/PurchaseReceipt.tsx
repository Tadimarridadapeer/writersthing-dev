// @ts-nocheck
import { Text, Section, Button } from'@react-email/components';
import * as React from'react';
import { Layout } from'./components/Layout'; interface PurchaseReceiptProps { itemName: string; total: string;
} export default function PurchaseReceipt({ itemName ='Item', total ='$0.00' }: PurchaseReceiptProps) { return ( <Layout previewText="Your purchase receipt" heading="Thanks for your purchase!"> <Text style={text}> Here is the receipt for your recent purchase. </Text> <Section style={receiptContainer}> <Text style={text}><strong>Item:</strong> {itemName}</Text> <Text style={text}><strong>Total:</strong> {total}</Text> </Section> <Section style={btnContainer}> <Button style={button} href="https://writersthing.com/library"> Go to Library </Button> </Section> </Layout> );
} const text = { color:'#333', fontSize:'16px', lineHeight:'26px', margin:'0 0 8px',
}; const receiptContainer = { backgroundColor:'#f9fafb', padding:'16px', borderRadius:'8px', margin:'24px 0',
}; const btnContainer = { textAlign:'center' as const, marginTop:'32px', marginBottom:'32px',
}; const button = { backgroundColor:'#000000', borderRadius:'4px', color:'#ffffff', fontSize:'16px', fontWeight:'600', textDecoration:'none', textAlign:'center' as const, display:'inline-block', padding:'12px 24px',
};
