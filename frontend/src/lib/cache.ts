class ServerCache {
  private static stories: any = null;
  private static storiesExpiry = 0;
  private static blogs: any = null;
  private static blogsExpiry = 0;

  static getStories() {
    if (Date.now() < this.storiesExpiry) return this.stories;
    return null;
  }

  static setStories(data: any, ttlMs: number) {
    this.stories = data;
    this.storiesExpiry = Date.now() + ttlMs;
  }

  static getBlogs() {
    if (Date.now() < this.blogsExpiry) return this.blogs;
    return null;
  }

  static setBlogs(data: any, ttlMs: number) {
    this.blogs = data;
    this.blogsExpiry = Date.now() + ttlMs;
  }

  static clearStories() {
    console.log("[SERVERLESS STORIES CACHE] Invalidated!");
    this.stories = null;
    this.storiesExpiry = 0;
  }

  static clearBlogs() {
    console.log("[SERVERLESS BLOGS CACHE] Invalidated!");
    this.blogs = null;
    this.blogsExpiry = 0;
  }
}

export default ServerCache;
