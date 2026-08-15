import * as React from'react';
import { Section, Text, Hr } from'@react-email/components'; export const Header = () => { return ( <Section className="mt-[24px]"> <Text className="text-black text-[24px] font-bold text-center p-0 my-0 tracking-widest uppercase text-sm"> Writersthing </Text> <Hr className="border border-solid border-gray-200 my-[20px] mx-0 w-full" /> </Section> );
}; export default Header;
