import * as React from'react';
import { Section, Text } from'@react-email/components'; interface EmailCardProps { title?: string; children: React.ReactNode; className?: string;
} export const EmailCard = ({ title, children, className ='' }: EmailCardProps) => { return ( <Section className={`bg-gray-50 rounded-lg p-[24px] my-[24px] border border-gray-200 ${className}`}> {title && ( <Text className="text-black text-[18px] font-semibold mb-[16px] mt-0"> {title} </Text> )} {children} </Section> );
}; export default EmailCard;
