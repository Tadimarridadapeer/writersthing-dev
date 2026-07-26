import { UserPreferences, RecommendedItem, RecommendationSection, RecommendationsPayload } from "@/types/recommendations";

export class RecommendationService {
  private supabase: any;
  private user: any;

  constructor(supabase: any, user: any) {
    this.supabase = supabase;
    this.user = user;
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    if (!this.user) return null;

    try {
      const [interestsRes, contentTypesRes, goalsRes] = await Promise.all([
        this.supabase.from("user_preferences").select("interest").eq("user_id", this.user.id),
        this.supabase.from("user_content_preferences").select("content_type").eq("user_id", this.user.id),
        this.supabase.from("user_goals").select("goal").eq("user_id", this.user.id)
      ]);

      if (interestsRes.error) throw interestsRes.error;
      
      const interests = interestsRes.data?.map((d: any) => d.interest) || [];
      const contentTypes = contentTypesRes.data?.map((d: any) => d.content_type) || [];
      const goals = goalsRes.data?.map((d: any) => d.goal) || [];

      if (interests.length === 0 && contentTypes.length === 0 && goals.length === 0) {
        return null;
      }

      return { interests, contentTypes, goals };
    } catch (error) {
      console.error("Error fetching preferences:", error);
      return null;
    }
  }

  private mapBookToItem(b: any): RecommendedItem {
    return {
      id: b.id,
      title: b.title,
      type: "Book",
      description: b.description || "An immersive book exploring captivating themes.",
      category: b.category || "Novel",
      cover: b.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800",
      author: b.authors?.users?.name || b.authors?.name || b.author?.name || "Unknown",
      url: `/book/${b.id}`,
      date: b.created_at,
      price: b.price || 99,
      isAuthor: this.user && (this.user.id === b.author_id || this.user.id === b.authors?.user_id)
    };
  }

  private mapStoryToItem(s: any): RecommendedItem {
    return {
      id: s.id,
      title: s.title,
      type: s.type || "Story",
      description: s.description || "A captivating piece sharing experiences and inspirations.",
      category: s.category || "General",
      cover: s.cover_url || (s.type === 'Blog' ? "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800" : "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800"),
      author: s.authors?.users?.name || s.authors?.name || "Unknown",
      url: s.type === 'Blog' ? `/blogs/${s.id}` : `/stories/${s.id}`,
      date: s.created_at,
      price: s.price || 0,
      isAuthor: this.user && (this.user.id === s.author_id || this.user.id === s.authors?.user_id)
    };
  }

  async getPersonalizedRecommendations(page: number = 1, limit: number = 10): Promise<RecommendationsPayload> {
    const preferences = await this.getUserPreferences();
    
    if (!preferences || preferences.interests.length === 0) {
      return this.getFallbackRecommendations(page, limit);
    }

    const sections: RecommendationSection[] = [];
    const mainInterest = preferences.interests[0];
    const from = (page - 1) * limit;
    const to = from + limit; // Fetch limit + 1
    
    // 1. Because You Like [Main Interest]
    try {
      const { data: books } = await this.supabase
        .from("books")
        .select("id, title, description, category, cover_url, price, created_at, author_id, authors:author_id(user_id, users:user_id(name))")
        .ilike("category", `%${mainInterest}%`)
        .range(from, to);
        
      if (books && books.length > 0) {
        sections.push({
          title: `Because You Like ${mainInterest}`,
          type: "row",
          items: books.slice(0, limit).map((b: any) => this.mapBookToItem(b))
        });
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Discover More (Mix of other interests)
    try {
      const otherInterests = preferences.interests.slice(1, 4);
      if (otherInterests.length > 0) {
        const query = otherInterests.map(i => `category.ilike.%${i}%`).join(',');
        
        const { data: stories } = await this.supabase
          .from("stories")
          .select("id, title, body, category, cover_image, type, created_at, author_id, authors:author_id(user_id, users:user_id(name))")
          .or(query)
          .range(from, to);
          
        if (stories && stories.length > 0) {
          sections.push({
            title: "Trending In Your Interests",
            type: "row",
            items: stories.slice(0, limit).map((s: any) => this.mapStoryToItem(s))
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    // 3. Fallback to general new releases if we don't have enough sections
    if (sections.length < 2) {
      try {
        const [booksRes, storiesRes] = await Promise.all([
          this.supabase
            .from("books")
            .select("id, title, description, category, cover_url, price, created_at, author_id, authors:author_id(user_id, users:user_id(name))")
            .eq("status", "Published")
            .order("created_at", { ascending: false })
            .range(from, to),
          this.supabase
            .from("stories")
            .select("id, title, body, category, cover_image, type, created_at, author_id, authors:author_id(user_id, users:user_id(name))")
            .eq("status", "Published")
            .order("created_at", { ascending: false })
            .range(from, to)
        ]);

        let combinedItems: RecommendedItem[] = [];
        if (booksRes.data) combinedItems.push(...booksRes.data.map((b: any) => this.mapBookToItem(b)));
        if (storiesRes.data) combinedItems.push(...storiesRes.data.map((s: any) => this.mapStoryToItem(s)));

        combinedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (combinedItems.length > 0) {
          sections.push({
            title: "New Releases",
            type: "row",
            items: combinedItems.slice(0, limit)
          });
        }
      } catch (e) {
        console.error("Error fetching new releases:", e);
      }
    }

    return {
      sections,
      preferences,
      hasPersonalization: true
    };
  }

  async getFallbackRecommendations(page: number = 1, limit: number = 10): Promise<RecommendationsPayload> {
    const sections: RecommendationSection[] = [];
    const from = (page - 1) * limit;
    const to = from + limit;

    // Trending Books
    try {
      const { data: books } = await this.supabase
        .from("books")
        .select("id, title, description, category, cover_url, price, created_at, author_id, authors:author_id(user_id, users:user_id(name))")
        .order("created_at", { ascending: false })
        .range(from, to);
        
      if (books && books.length > 0) {
        sections.push({
          title: "Trending Books",
          type: "row",
          items: books.slice(0, limit).map((b: any) => this.mapBookToItem(b))
        });
      }
    } catch (e) { console.error(e); }

    // Popular Stories
    try {
      const { data: stories } = await this.supabase
        .from("stories")
        .select("id, title, body, category, cover_image, type, created_at, author_id, authors:author_id(user_id, users:user_id(name))")
        .eq("type", "Story")
        .order("created_at", { ascending: false })
        .range(from, to);
        
      if (stories && stories.length > 0) {
        sections.push({
          title: "Latest Stories",
          type: "row",
          items: stories.slice(0, limit).map((s: any) => this.mapStoryToItem(s))
        });
      }
    } catch (e) { console.error(e); }
    
    // Popular Blogs
    try {
      const { data: blogs } = await this.supabase
        .from("stories") // Assume blogs are in stories based on existing code `eq("type", "Blog")`
        .select("id, title, body, category, cover_image, type, created_at, author_id, authors:author_id(user_id, users:user_id(name))")
        .eq("type", "Blog")
        .order("created_at", { ascending: false })
        .range(from, to);
        
      if (blogs && blogs.length > 0) {
        sections.push({
          title: "Popular Blogs",
          type: "row",
          items: blogs.slice(0, limit).map((b: any) => this.mapStoryToItem(b))
        });
      }
    } catch (e) { console.error(e); }

    return {
      sections,
      preferences: null,
      hasPersonalization: false
    };
  }
}
