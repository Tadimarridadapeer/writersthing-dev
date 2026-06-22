class ServerCache {
  private static articles: any = null;
  private static articlesExpiry = 0;
  private static blogs: any = null;
  private static blogsExpiry = 0;

  static getArticles() {
    if (Date.now() < this.articlesExpiry) return this.articles;
    return null;
  }

  static setArticles(data: any, ttlMs: number) {
    this.articles = data;
    this.articlesExpiry = Date.now() + ttlMs;
  }

  static getBlogs() {
    if (Date.now() < this.blogsExpiry) return this.blogs;
    return null;
  }

  static setBlogs(data: any, ttlMs: number) {
    this.blogs = data;
    this.blogsExpiry = Date.now() + ttlMs;
  }

  static clearArticles() {
    console.log("[SERVERLESS ARTICLES CACHE] Invalidated!");
    this.articles = null;
    this.articlesExpiry = 0;
  }

  static clearBlogs() {
    console.log("[SERVERLESS BLOGS CACHE] Invalidated!");
    this.blogs = null;
    this.blogsExpiry = 0;
  }
}

export default ServerCache;
