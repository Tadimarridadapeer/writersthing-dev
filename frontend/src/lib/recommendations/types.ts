import { RecommendationBlock } from '@/emails/DynamicRecommendationEmail';

export interface RecommendationEngineParams {
  to: string | string[];
  subject: string;
  headerTitle: string;
  introText?: string;
  blocks: RecommendationBlock[];
}
