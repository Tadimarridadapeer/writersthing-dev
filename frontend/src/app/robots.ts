import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/profile/',
        '/write/',
        '/api/',
        '/cart',
        '/payment',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/onboarding',
        '/editor'
      ],
    },
    sitemap: 'https://www.writersthing.com/sitemap.xml',
  }
}
