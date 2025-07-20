// Static export configuration for sitemap
export const dynamic = 'force-static'

import { APP_BASE_URL } from '@/constants/app';

export default function sitemap() {
  const baseUrl = APP_BASE_URL
  const lastModified = new Date('2025-07-20').toISOString()
  
  return [
    {
      url: baseUrl,
      lastModified: lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/create-room`,
      lastModified: lastModified,
      changeFrequency: 'monthly', 
      priority: 0.9,
    },
    {
      url: `${baseUrl}/join-room`,
      lastModified: lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Room pages with specific codes are not included for privacy
    // and because they are dynamically generated and temporary
  ]
}