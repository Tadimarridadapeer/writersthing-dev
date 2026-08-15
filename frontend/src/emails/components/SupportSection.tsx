import * as React from'react';
import { Section, Text, Link } from'@react-email/components';
import { Divider } from'./Divider'; interface SupportSectionProps { email?: string;
} export const SupportSection = ({ email ='support@writersthing.com' }: SupportSectionProps) => { return ( <Section> <Divider /> <Text className="text-gray-500 text-[14px] leading-[24px] text-center"> Need Help? Contact us at{''} <Link href={`mailto:${email}`} className="text-black underline font-medium"> {email} </Link> </Text> </Section> );
}; export default SupportSection;
