const SITE_URL = 'https://fielddeskops.com'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/auth/',
          '/dashboard/',
          '/apps/',
          '/account/',
          '/api/',
          '/forgot-password',
          '/reset-password',
          '/sign/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
