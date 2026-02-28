import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  // Set proper content type
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  // robots.txt content
  const robots = `User-agent: *
Allow: /

Sitemap: https://ngo-grants.example.com/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/scrape

# Allow search engines to index media files
Allow: /_nuxt/
Allow: /_ipx/
Allow: /_image/
`

  return robots
})