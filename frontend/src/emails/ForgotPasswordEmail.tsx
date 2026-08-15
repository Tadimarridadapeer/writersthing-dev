// @ts-nocheck
import * as React from'react';
import { Section, Text, Heading } from'@react-email/components';
import { BaseLayout as EmailLayout } from'./layouts/BaseLayout';
import { Button as EmailButton } from'./components/Button';
import { EmailCard } from'./components/EmailCard';
import { SocialLinks } from'./components/SocialLinks'; interface ForgotPasswordEmailProps { name?: string; resetUrl?: string; expiryMinutes?: number;
} export const ForgotPasswordEmail = ({ name ='Writer', resetUrl ='https://writersthing.com/reset-password', expiryMinutes = 30,
}: ForgotPasswordEmailProps) => { return ( <EmailLayout previewText="Reset your Writersthing password"> <Section> <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[24px] mx-0"> Reset Your Password </Heading> <Text className="text-gray-700 text-[16px] leading-[26px]"> Hi {name}, </Text> <Text className="text-gray-700 text-[16px] leading-[26px]"> We received a request to reset the password for your Writersthing account. </Text> </Section> <EmailButton href={resetUrl}> Reset Password </EmailButton> <EmailCard title="Security Notice"> <Text className="text-gray-700 text-[15px] leading-[24px] mt-0"> This password reset link will expire in {expiryMinutes} minutes. </Text> <Text className="text-gray-500 text-[14px] leading-[22px] mt-[12px] mb-0 italic"> If you did not request a password reset, please safely ignore this email or contact support if you have concerns. Your account remains secure. </Text> </EmailCard> <SocialLinks /> </EmailLayout> );
}; export default ForgotPasswordEmail;
