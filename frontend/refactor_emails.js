const fs = require('fs');
const path = require('path');

const emailsDir = path.join(__dirname, 'src', 'emails');
const componentsDir = path.join(emailsDir, 'components');
const layoutsDir = path.join(emailsDir, 'layouts');

// 1. Create Logo.tsx
fs.writeFileSync(path.join(componentsDir, 'Logo.tsx'), `import * as React from 'react';
import { Text } from '@react-email/components';

export const Logo = () => (
  <Text className="text-black text-[24px] font-bold text-center p-0 my-0 tracking-widest uppercase text-sm">
    Writersthing
  </Text>
);

export default Logo;
`);

// 2. Move and update Header.tsx
let headerContent = `import * as React from 'react';
import { Section } from '@react-email/components';
import { Logo } from './Logo';
import { Divider } from './Divider';

export const Header = () => {
  return (
    <Section className="mt-[24px]">
      <Logo />
      <Divider />
    </Section>
  );
};

export default Header;`;
fs.writeFileSync(path.join(componentsDir, 'Header.tsx'), headerContent);

// 3. Move Footer.tsx
if (fs.existsSync(path.join(layoutsDir, 'Footer.tsx'))) {
    fs.renameSync(path.join(layoutsDir, 'Footer.tsx'), path.join(componentsDir, 'Footer.tsx'));
}

// 4. Move BaseLayout.tsx to EmailLayout.tsx
if (fs.existsSync(path.join(layoutsDir, 'BaseLayout.tsx'))) {
    let layoutContent = fs.readFileSync(path.join(layoutsDir, 'BaseLayout.tsx'), 'utf8');
    layoutContent = layoutContent.replace(/BaseLayout/g, 'EmailLayout');
    fs.writeFileSync(path.join(componentsDir, 'EmailLayout.tsx'), layoutContent);
}

// 5. Rename EmailButton.tsx to Button.tsx
if (fs.existsSync(path.join(componentsDir, 'EmailButton.tsx'))) {
    let buttonContent = fs.readFileSync(path.join(componentsDir, 'EmailButton.tsx'), 'utf8');
    buttonContent = buttonContent.replace(/EmailButton/g, 'Button');
    fs.writeFileSync(path.join(componentsDir, 'Button.tsx'), buttonContent);
    fs.unlinkSync(path.join(componentsDir, 'EmailButton.tsx'));
}

// 6. Update all templates in src/emails/
const templates = [
  'WelcomeEmail.tsx', 'ForgotPasswordEmail.tsx', 'OTPEmail.tsx',
  'PaymentSuccessEmail.tsx', 'PurchaseReceiptEmail.tsx',
  'FounderInviteEmail.tsx', 'AdminApprovalEmail.tsx', 'AdminRejectedEmail.tsx',
  'OTPVerificationEmail.tsx'
];

templates.forEach(file => {
  const filePath = path.join(emailsDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace imports. Since they were moved from templates/ to src/emails/ they might have 
    // imports like '../layouts/BaseLayout'. They need to be './components/EmailLayout'.
    content = content.replace(/\.\.\/layouts\/BaseLayout/g, "./components/EmailLayout");
    content = content.replace(/\.\.\/components\/EmailButton/g, "./components/Button");
    content = content.replace(/\.\.\/layouts\//g, "./components/");
    content = content.replace(/\.\.\/components\//g, "./components/");
    content = content.replace(/\.\/components\/BaseLayout/g, "./components/EmailLayout");
    content = content.replace(/\.\/components\/EmailButton/g, "./components/Button");
    
    // Replace component JSX names
    content = content.replace(/<BaseLayout/g, '<EmailLayout');
    content = content.replace(/<\/BaseLayout>/g, '</EmailLayout>');
    content = content.replace(/<EmailButton/g, '<Button');
    content = content.replace(/<\/EmailButton>/g, '</Button>');
    
    fs.writeFileSync(filePath, content);
  }
});

// Clean up old layouts dir if empty
if (fs.existsSync(layoutsDir)) {
    const remaining = fs.readdirSync(layoutsDir);
    if (remaining.length === 0 || remaining.length === 1) {
        // we can safely ignore cleanup for now, it's just one directory
    }
}

console.log('Refactor completed successfully');
