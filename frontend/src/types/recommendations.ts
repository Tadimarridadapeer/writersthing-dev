export interface UserPreferences {
  interests: string[];
  contentTypes: string[];
  goals: string[];
}

export interface RecommendedItem {
  id: string;
  title: string;
  type: string;
  description: string;
  category: string;
  cover: string;
  author: string;
  url: string;
  date: string;
  price?: number;
  isAuthor?: boolean;
}

export interface RecommendationSection {
  title: string;
  subtitle?: string;
  items: RecommendedItem[];
  type: "hero" | "row" | "grid";
}

export interface RecommendationsPayload {
  sections: RecommendationSection[];
  preferences: UserPreferences | null;
  hasPersonalization: boolean;
}
