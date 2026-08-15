import * as React from'react';
import { Button as EmailButton, Section } from'@react-email/components'; interface ButtonProps { href: string; children: React.ReactNode;
} export const Button = ({ href, children }: ButtonProps) => {
  return (
    <Section className="text-center mt-[32px] mb-[32px]">
      <EmailButton
        className="bg-[#7C3AED] text-white text-[16px] font-semibold rounded-md py-[14px] px-[32px] text-center w-auto no-underline shadow-sm"
        href={href}
      >
        {children}
      </EmailButton>
    </Section>
  );
}; export default Button;
// Alias so email templates can import { EmailButton }
export { Button as EmailButton };

