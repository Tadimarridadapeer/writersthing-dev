import * as React from'react';
import { Section, Text, Link } from'@react-email/components';
import { colors } from'../styles/colors';
import { typography } from'../styles/typography'; export const Footer = () => { return ( <Section> <Text className="text-gray-500 text-[14px] leading-[24px] text-center"> Need Help? Contact us at{''} <Link href="mailto:hello@writersthing.com" className="text-black underline font-medium"> hello@writersthing.com </Link> </Text> <Text className="text-gray-400 text-[12px] leading-[20px] text-center mt-[12px]"> © {new Date().getFullYear()} Writersthing Team. All rights reserved. </Text> </Section> );
}; export default Footer;
