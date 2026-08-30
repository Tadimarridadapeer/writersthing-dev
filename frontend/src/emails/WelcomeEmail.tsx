import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Text, Heading, Link, Img, Hr } from '@react-email/components';

export const WelcomeEmail = ({ name = 'Writer' }: { name?: string }) => {
  return (
    <Html>
      <Head />
      <Preview>Publish your work, discover new voices, and find your place in a community of writers.</Preview>
      <Body style={{ backgroundColor: '#ffffff', color: '#000000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', margin: '0 auto', padding: '0' }}>
        <Container style={{ margin: '0 auto', padding: '60px 20px', maxWidth: '600px', backgroundColor: '#ffffff' }}>
          
          {/* HEADER */}
          <Section style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Img src="https://www.writersthing.com/logo.png" width="160" height="auto" alt="Writer's Thing Logo" style={{ margin: '0 auto', display: 'block', marginBottom: '24px', maxWidth: '100%', height: 'auto' }} />
            <Text style={{ fontSize: '12px', fontWeight: 'normal', letterSpacing: '3px', textTransform: 'uppercase', margin: '0', color: '#666666', fontFamily: 'Georgia, serif' }}>
              Write &bull; Publish &bull; Inspire
            </Text>
          </Section>

          {/* HERO */}
          <Section style={{ marginBottom: '60px' }}>
            <Heading as="h1" style={{ fontSize: '36px', lineHeight: '1.2', fontWeight: 'normal', margin: '0 0 16px 0', color: '#000000', fontFamily: 'Georgia, serif' }}>
              Welcome to Writer's Thing, {name}.
            </Heading>
            <Heading as="h2" style={{ fontSize: '24px', lineHeight: '1.4', fontWeight: 'normal', margin: '0 0 32px 0', color: '#666666', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Your words have a place here.
            </Heading>
            
            <Text style={{ fontSize: '16px', lineHeight: '1.8', margin: '0 0 24px 0', color: '#333333' }}>
              We're glad you're here.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.8', margin: '0 0 24px 0', color: '#333333' }}>
              Writer's Thing is a space built around the people who write, read, create, and believe that a good story can stay with someone long after they've finished reading it.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.8', margin: '0 0 40px 0', color: '#333333' }}>
              Publish what you've written. Discover something worth reading. Meet people who share your love for words.
            </Text>
            
            <Link href="https://writersthing.com" style={{ display: 'inline-block', backgroundColor: '#000000', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none', padding: '16px 36px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Explore Writer's Thing →
            </Link>
          </Section>

          <Hr style={{ borderColor: '#eaeaea', margin: '0 0 60px 0', borderWidth: '1px', borderStyle: 'solid' }} />

          {/* FEATURE SECTION */}
          <Section style={{ marginBottom: '60px' }}>
            <Heading as="h3" style={{ fontSize: '20px', fontWeight: 'normal', margin: '0 0 40px 0', color: '#000000', fontFamily: 'Georgia, serif' }}>
              What you can do here
            </Heading>

            {/* 01 */}
            <Section style={{ marginBottom: '40px' }}>
              <Text style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: '#999999', margin: '0 0 12px 0', textTransform: 'uppercase' }}>01 — Publish</Text>
              <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#333333', margin: '0' }}>Turn your stories and ideas into something people can discover, read, and remember.</Text>
            </Section>
            
            <Hr style={{ borderColor: '#f5f5f5', margin: '0 0 40px 0', borderWidth: '1px', borderStyle: 'solid' }} />
            
            {/* 02 */}
            <Section style={{ marginBottom: '40px' }}>
              <Text style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: '#999999', margin: '0 0 12px 0', textTransform: 'uppercase' }}>02 — Discover</Text>
              <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#333333', margin: '0' }}>Find books, stories, and voices from writers across the community.</Text>
            </Section>

            <Hr style={{ borderColor: '#f5f5f5', margin: '0 0 40px 0', borderWidth: '1px', borderStyle: 'solid' }} />

            {/* 03 */}
            <Section style={{ marginBottom: '40px' }}>
              <Text style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: '#999999', margin: '0 0 12px 0', textTransform: 'uppercase' }}>03 — Connect</Text>
              <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#333333', margin: '0' }}>Share thoughts, leave a comment, start a conversation, and become part of the community.</Text>
            </Section>

            <Hr style={{ borderColor: '#f5f5f5', margin: '0 0 40px 0', borderWidth: '1px', borderStyle: 'solid' }} />

            {/* 04 */}
            <Section style={{ marginBottom: '20px' }}>
              <Text style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: '#999999', margin: '0 0 12px 0', textTransform: 'uppercase' }}>04 — Build</Text>
              <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#333333', margin: '0' }}>Grow your readership, develop your voice, and create something that belongs to you.</Text>
            </Section>
          </Section>

          <Hr style={{ borderColor: '#eaeaea', margin: '0 0 60px 0', borderWidth: '1px', borderStyle: 'solid' }} />

          {/* CLOSING */}
          <Section style={{ marginBottom: '60px' }}>
            <Text style={{ fontSize: '20px', lineHeight: '1.6', margin: '0 0 24px 0', color: '#000000', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              There is always another story to tell.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.8', margin: '0 0 24px 0', color: '#333333' }}>
              We're happy to have you here.<br/>Welcome to Writer's Thing.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.8', margin: '0', color: '#000000', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
              — The Writer's Thing Team
            </Text>
          </Section>

          <Hr style={{ borderColor: '#000000', margin: '0 0 40px 0', borderWidth: '2px', borderStyle: 'solid' }} />

          {/* FOOTER */}
          <Section style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 8px 0', color: '#000000', textTransform: 'uppercase' }}>
              Writer's Thing
            </Text>
            <Text style={{ fontSize: '12px', color: '#999999', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 24px 0', fontFamily: 'Georgia, serif' }}>
              Write · Publish · Inspire
            </Text>
            <Link href="https://www.writersthing.com/" style={{ fontSize: '13px', color: '#000000', textDecoration: 'underline', display: 'inline-block', margin: '0 0 40px 0', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Visit Writer's Thing →
            </Link>

            <Text style={{ fontSize: '11px', color: '#999999', margin: '0 0 16px 0', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Community
            </Text>
            
            <Section style={{ marginBottom: '32px' }}>
              <Link href="https://www.whatsapp.com/channel/0029VbCCMcBIiRouZwg8FH27" style={{ color: '#666666', fontSize: '12px', textDecoration: 'none', margin: '0 12px' }}>WhatsApp</Link>
              <span style={{ color: '#eaeaea' }}>|</span>
              <Link href="https://www.instagram.com/writersthingofficial/" style={{ color: '#666666', fontSize: '12px', textDecoration: 'none', margin: '0 12px' }}>Instagram</Link>
              <span style={{ color: '#eaeaea' }}>|</span>
              <Link href="https://www.linkedin.com/company/writers-thing/" style={{ color: '#666666', fontSize: '12px', textDecoration: 'none', margin: '0 12px' }}>LinkedIn</Link>
            </Section>

            <Section style={{ marginBottom: '40px' }}>
              <Link href="https://www.writersthing.com/privacy" style={{ color: '#999999', fontSize: '12px', textDecoration: 'underline', margin: '0 12px' }}>Privacy</Link>
              <Link href="https://www.writersthing.com/terms" style={{ color: '#999999', fontSize: '12px', textDecoration: 'underline', margin: '0 12px' }}>Terms</Link>
              <Link href="https://www.writersthing.com/contact" style={{ color: '#999999', fontSize: '12px', textDecoration: 'underline', margin: '0 12px' }}>Support</Link>
            </Section>

            <Text style={{ fontSize: '11px', color: '#b3b3b3', margin: '0', letterSpacing: '1px' }}>
              © {'2024'} WRITER'S THING. ALL RIGHTS RESERVED.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;
