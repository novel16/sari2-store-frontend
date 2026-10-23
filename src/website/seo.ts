import type { PublicSiteData } from './types'

export const publicPaths = ['/', '/pricing'] as const
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  )
export const serializeJson = (value: unknown) =>
  JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  )

export function siteOrigin(value: string): string {
  const url = new URL(value)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error(
      'SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.',
    )
  return url.origin
}
export const canonicalUrl = (siteUrl: string, path: string) =>
  new URL(path.split(/[?#]/, 1)[0] === '/pricing' ? '/pricing' : '/', siteOrigin(siteUrl)).href

export function schemaGraph(data: PublicSiteData, path: string, siteUrl: string) {
  const root = canonicalUrl(siteUrl, '/'),
    canonical = canonicalUrl(siteUrl, path),
    c = data.content
  const organizationId = root + '#organization',
    websiteId = root + '#website'
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: c.brand.name,
      url: root,
      logo: new URL(c.media.logo_url || '/sarisari.svg', root).href,
      ...(c.footer.contact_email ? { email: c.footer.contact_email } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: root,
      name: c.brand.name,
      inLanguage: 'en-PH',
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'WebPage',
      '@id': canonical + '#page',
      url: canonical,
      name: path === '/pricing' ? c.pricing.title : c.home.title,
      description: path === '/pricing' ? c.pricing.description : c.home.description,
      inLanguage: 'en-PH',
      isPartOf: { '@id': websiteId },
    },
    {
      '@type': 'WebApplication',
      '@id': root + '#application',
      name: c.brand.name,
      url: root,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web browser',
      description: c.home.description,
      publisher: { '@id': organizationId },
      offers: data.plans
        .filter((plan) => plan.catalog_status === 'published')
        .map((plan) => ({
          '@type': 'Offer',
          name: plan.name + ' monthly plan',
          price: (plan.monthly_price_centavos / 100).toFixed(2),
          priceCurrency: 'PHP',
          url: canonicalUrl(siteUrl, '/pricing'),
        })),
    },
  ]
  if (path === '/pricing')
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: root },
        { '@type': 'ListItem', position: 2, name: 'Pricing', item: canonical },
      ],
    })
  return { '@context': 'https://schema.org', '@graph': graph }
}

export function seoHead(data: PublicSiteData, path: string, siteUrl: string, indexable: boolean) {
  const c = data.content,
    page = path === '/pricing' ? c.pricing : c.home,
    canonical = canonicalUrl(siteUrl, path)
  const image = new URL(c.media.og_image_url || '/social-card.png', siteOrigin(siteUrl)).href
  const meta = (name: string, value: string, property = false) =>
    `<meta ${property ? 'property' : 'name'}="${name}" content="${escapeHtml(value)}">`
  return [
    `<title>${escapeHtml(page.title)}</title>`,
    meta('description', page.description),
    meta('robots', indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'),
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<link rel="alternate" hreflang="en-PH" href="${escapeHtml(canonical)}">`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}">`,
    meta('og:type', 'website', true),
    meta('og:site_name', c.brand.name, true),
    meta('og:locale', 'en_PH', true),
    meta('og:title', page.title, true),
    meta('og:description', page.description, true),
    meta('og:url', canonical, true),
    meta('og:image', image, true),
    meta('og:image:alt', c.media.og_image_alt, true),
    meta('twitter:card', 'summary_large_image'),
    meta('twitter:title', page.title),
    meta('twitter:description', page.description),
    meta('twitter:image', image),
    meta('twitter:image:alt', c.media.og_image_alt),
    `<script type="application/ld+json">${serializeJson(schemaGraph(data, path, siteUrl))}</script>`,
  ].join('\n')
}

export function sitemap(data: PublicSiteData, siteUrl: string, indexable: boolean) {
  const date = new Date(data.updated_at)
  const lastmod = Number.isNaN(date.getTime()) ? '' : `<lastmod>${date.toISOString()}</lastmod>`
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexable ? publicPaths.map((path) => `<url><loc>${escapeHtml(canonicalUrl(siteUrl, path))}</loc>${lastmod}</url>`).join('') : ''}</urlset>`
}
export function robots(siteUrl: string, indexable: boolean) {
  // Keep paths crawlable so crawlers can see their noindex headers/meta tags.
  return `User-agent: *\nAllow: /\n${indexable ? `Sitemap: ${siteOrigin(siteUrl)}/sitemap.xml\n` : ''}`
}
