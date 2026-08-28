const SITE_URL = 'https://fielddeskops.com'

export default function sitemap() {
  const lastModified = new Date()

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/welcome`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/reviews`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
}
