export const STORAGE_CONFIG = {
  buckets: {
    publicProfiles: "profiles",
    publicCovers: "covers",
    publicArticles: "article-images",
    publicBlogs: "blog-images",
    privateManuscripts: "books",
  },
  security: {
    // 60-second expiry for signed URLs for premium content
    signedUrlExpirySeconds: 60,
  }
};
