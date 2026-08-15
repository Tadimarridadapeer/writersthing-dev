import * as React from'react';
import { Body, Container, Head, Html, Preview, Tailwind } from'@react-email/components';
import { Header } from'../components/Header';
import { Footer } from'../components/Footer'; interface BaseLayoutProps { previewText: string; children: React.ReactNode;
} export const BaseLayout = ({ previewText, children }: BaseLayoutProps) => { return ( <Html> <Head />
      <Preview>{previewText}</Preview> <Tailwind>  <Body className="bg-white my-auto mx-auto font-sans"> <Container className="border border-solid border-gray-200 rounded-xl my-[40px] mx-auto p-[20px] w-[600px] bg-white shadow-sm"> <Header /> {children} <Footer /> </Container> </Body> </Tailwind> </Html> );
}; export default BaseLayout;
// Alias so email templates can import either name
export { BaseLayout as EmailLayout };
