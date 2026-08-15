import { dispatchRecommendationEmail } from './engine';

// Mock placeholders - These will be replaced by actual DB/AI data later.
const MOCK_BOOK_COVER = 'https://placehold.co/400x600/e2e8f0/1e293b?text=Book+Cover';
const MOCK_AUTHOR_AVATAR = 'https://placehold.co/400x400/e2e8f0/1e293b?text=Author';

export const sendRecommendedBooks = async (to: string) => {
  return dispatchRecommendationEmail({
    to,
    subject: 'Books Handpicked For You',
    headerTitle: 'Recommended Reading',
    introText: 'Based on your recent reads, we think you might love these handpicked selections.',
    blocks: [
      {
        type: 'book',
        data: {
          coverUrl: MOCK_BOOK_COVER,
          title: 'The Echoes of Time',
          author: 'Eleanor Vance',
          description: 'A gripping tale of mystery and suspense that will keep you on the edge of your seat until the very last page.',
          ctaText: 'Read Now',
          ctaUrl: 'https://writersthing.com/book/123'
        }
      },
      {
        type: 'book',
        data: {
          coverUrl: MOCK_BOOK_COVER,
          title: 'Winds of Change',
          author: 'Marcus Aurelius',
          description: 'A profound exploration of the human spirit in times of turbulent change.',
          ctaText: 'Read Now',
          ctaUrl: 'https://writersthing.com/book/124'
        }
      }
    ]
  });
};

export const sendTrendingBooks = async (to: string) => {
  return dispatchRecommendationEmail({
    to,
    subject: 'Trending Now on Writersthing',
    headerTitle: 'Trending Books',
    introText: 'Discover what everyone is talking about this week. These books are currently topping our charts.',
    blocks: [
      {
        type: 'book',
        data: {
          coverUrl: MOCK_BOOK_COVER,
          title: 'The Silent Observer',
          author: 'John Doe',
          description: 'The #1 most read thriller on Writersthing this week.',
          ctaText: 'View Book',
          ctaUrl: 'https://writersthing.com/book/999'
        }
      }
    ]
  });
};

export const sendContinueReading = async (to: string) => {
  return dispatchRecommendationEmail({
    to,
    subject: 'Pick up where you left off',
    headerTitle: 'Continue Reading',
    introText: 'You left off at Chapter 4. Dive back into the story!',
    blocks: [
      {
        type: 'book',
        data: {
          coverUrl: MOCK_BOOK_COVER,
          title: 'Journey to the Center',
          author: 'Jane Smith',
          description: 'You are 40% through this epic adventure.',
          ctaText: 'Resume Reading',
          ctaUrl: 'https://writersthing.com/read/456'
        }
      }
    ]
  });
};

export const sendWeeklyDigest = async (to: string) => {
  return dispatchRecommendationEmail({
    to,
    subject: 'Your Weekly Writersthing Digest',
    headerTitle: 'Weekly Digest',
    introText: 'Here is your personalized summary of the best content on Writersthing from the past week.',
    blocks: [
      {
        type: 'author',
        data: {
          avatarUrl: MOCK_AUTHOR_AVATAR,
          name: 'Sarah Jenkins',
          bio: 'Top trending author of the week, known for her captivating sci-fi series.',
          ctaText: 'View Profile',
          ctaUrl: 'https://writersthing.com/author/sarah'
        }
      },
      {
        type: 'book',
        data: {
          coverUrl: MOCK_BOOK_COVER,
          title: 'Neon Gods',
          author: 'Sarah Jenkins',
          description: 'Her latest release is taking the community by storm.',
          ctaText: 'Read Book',
          ctaUrl: 'https://writersthing.com/book/777'
        }
      }
    ]
  });
};

export const sendAuthorUpdates = async (to: string) => {
  return dispatchRecommendationEmail({
    to,
    subject: 'New updates from your favorite authors',
    headerTitle: 'Author Updates',
    introText: 'Authors you follow have published new content.',
    blocks: [
      {
        type: 'author',
        data: {
          avatarUrl: MOCK_AUTHOR_AVATAR,
          name: 'David Wallace',
          bio: 'David just published a new article about his writing process.',
          ctaText: 'Read Article',
          ctaUrl: 'https://writersthing.com/article/12'
        }
      }
    ]
  });
};

export const sendNewRelease = async (to: string) => {
  return dispatchRecommendationEmail({
    to,
    subject: 'A New Release You Will Love',
    headerTitle: 'New Release',
    introText: 'Based on your interest in Fantasy, we think you will love this highly anticipated new release.',
    blocks: [
      {
        type: 'book',
        data: {
          coverUrl: MOCK_BOOK_COVER,
          title: 'The Final Empire',
          author: 'Brandon',
          description: 'The spectacular conclusion to the epic saga.',
          ctaText: 'Read Now',
          ctaUrl: 'https://writersthing.com/book/10'
        }
      }
    ]
  });
};
