// @ts-nocheck
import * as React from 'react';
import { Section, Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { Button } from './components/Button';
import { BookCard, BookCardProps } from './components/BookCard';
import { AuthorCard, AuthorCardProps } from './components/AuthorCard';
import { SocialLinks } from './components/SocialLinks';

export type RecommendationBlock = 
  | { type: 'book'; data: BookCardProps }
  | { type: 'author'; data: AuthorCardProps }
  | { type: 'text'; data: { content: string } }
  | { type: 'button'; data: { ctaText: string; ctaUrl: string } };

export interface DynamicRecommendationEmailProps {
  previewText?: string;
  headerTitle: string;
  introText?: string;
  blocks: RecommendationBlock[];
}

export const DynamicRecommendationEmail = ({
  previewText = 'Recommendations for you',
  headerTitle = 'Recommended for You',
  introText,
  blocks = [],
}: DynamicRecommendationEmailProps) => {
  return (
    <EmailLayout previewText={previewText}>
      <Section>
        <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[24px] mx-0">
          {headerTitle}
        </Heading>
        {introText && (
          <Text className="text-gray-700 text-[16px] leading-[26px] mb-[24px]">
            {introText}
          </Text>
        )}
      </Section>

      {blocks.map((block, index) => {
        switch (block.type) {
          case 'book':
            return <BookCard key={index} {...block.data} />;
          case 'author':
            return <AuthorCard key={index} {...block.data} />;
          case 'text':
            return (
              <Text key={index} className="text-gray-700 text-[16px] leading-[26px] mb-[16px]">
                {block.data.content}
              </Text>
            );
          case 'button':
            return (
              <Button key={index} href={block.data.ctaUrl}>
                {block.data.ctaText}
              </Button>
            );
          default:
            return null;
        }
      })}

      <SocialLinks />
    </EmailLayout>
  );
};

export default DynamicRecommendationEmail;
