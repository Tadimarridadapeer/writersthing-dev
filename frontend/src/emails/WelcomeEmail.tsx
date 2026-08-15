// @ts-nocheck
import * as React from'react';
import { Section, Text, Heading } from'@react-email/components';
import { BaseLayout as EmailLayout } from'./layouts/BaseLayout';
import { Button as EmailButton } from'./components/Button';
import { EmailCard } from'./components/EmailCard';
import { FeatureGrid } from'./components/FeatureGrid';
import { SocialLinks } from'./components/SocialLinks'; interface WelcomeEmailProps { name?: string; dashboardUrl?: string;
} export const WelcomeEmail = ({ name ='Writer', dashboardUrl ='https://writersthing.com/dashboard',
}: WelcomeEmailProps) => { const features = [ { title:'Publish Books', description:'Share your manuscripts with the world.' }, { title:'Read Articles', description:'Discover premium content and insights.' }, { title:'Join Community', description:'Connect with fellow writers.' }, { title:'Grow as Writer', description:'Access tools to build your audience.' }, ]; return ( <EmailLayout previewText={`Welcome to Writersthing, ${name}!`}> <Section> <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[24px] mx-0"> Welcome Aboard, {name}! </Heading> <Text className="text-gray-700 text-[16px] leading-[26px]"> We are thrilled to have you join Writersthing. You are now part of a growing community dedicated to the art of storytelling and the business of writing. </Text> </Section> <EmailCard title="Here's what you can do next:"> <FeatureGrid features={features} /> </EmailCard> <EmailButton href={dashboardUrl}> Go to Dashboard </EmailButton> <SocialLinks /> </EmailLayout> );
}; export default WelcomeEmail;
