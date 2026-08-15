import * as React from'react';
import { Section, Text, Link } from'@react-email/components'; interface SocialLinksProps { twitter?: string; linkedin?: string; instagram?: string;
} export const SocialLinks = ({ twitter ='https://twitter.com/writersthing', linkedin ='https://linkedin.com/company/writersthing', instagram ='https://instagram.com/writersthing',
}: SocialLinksProps) => { return ( <Section className="text-center mt-[12px]"> <Text className="text-[12px] leading-[24px]"> {twitter && ( <Link href={twitter} className="text-gray-500 underline mx-[8px]"> Twitter </Link> )} {linkedin && ( <Link href={linkedin} className="text-gray-500 underline mx-[8px]"> LinkedIn </Link> )} {instagram && ( <Link href={instagram} className="text-gray-500 underline mx-[8px]"> Instagram </Link> )} </Text> </Section> );
}; export default SocialLinks;
