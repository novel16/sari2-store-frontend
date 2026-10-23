import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import { createSourceModule } from '../testing/sourceModule.mjs'
import { createSiteLoader, publicMiddleware } from '../../server/public-site.mjs'
import { siteConfig } from '../../server/config.mjs'

const source = createSourceModule(import.meta.url)
const imports = Object.fromEntries(
  ['react', 'react/jsx-runtime', 'lucide-react'].map((name) => [name, import.meta.resolve(name)]),
)
const seoUrl = await source('./seo.ts')
const { canonicalUrl, seoHead, serializeJson, sitemap, robots } = await import(seoUrl)
const format = await source('../lib/format.ts')
const layout = await source('../layouts/PublicLayout.tsx', { ...imports })
const preview = await source('./StorePreview.tsx', imports)
const pricing = await source('./PricingCards.tsx', { ...imports, '../lib/format': format })
const publicSite = await source('./PublicSite.tsx', {
  ...imports,
  '../layouts/PublicLayout': layout,
  './StorePreview': preview,
  './PricingCards': pricing,
})
const renderer = await import(
  await source('./entry-server.tsx', {
    ...imports,
    'react-dom/server': import.meta.resolve('react-dom/server'),
    './PublicSite': publicSite,
    './seo': seoUrl,
  })
)
const content = JSON.parse(await readFile(new URL('./site.fixture.json', import.meta.url), 'utf8'))
const fixture = {
  content,
  revision: 'one',
  version: 1,
  published_at: '2026-10-23T01:00:00Z',
  updated_at: '2026-10-23T02:00:00Z',
  billing_available: true,
  plans: [
    {
      id: 1,
      code: 'free',
      name: 'Free',
      monthly_price_centavos: 0,
      active_product_limit: 100,
      store_limit: 1,
      staff_limit: 0,
      catalog_status: 'published',
      quota_scope: 'store',
    },
    {
      id: 2,
      code: 'basic',
      name: 'Basic',
      monthly_price_centavos: 4900,
      active_product_limit: 500,
      store_limit: 1,
      staff_limit: 0,
      catalog_status: 'published',
      quota_scope: 'store',
      featured: true,
    },
    {
      id: 3,
      code: 'pro',
      name: 'Pro',
      monthly_price_centavos: 24900,
      active_product_limit: 3000,
      store_limit: 3,
      staff_limit: 5,
      catalog_status: 'coming_soon',
      quota_scope: 'account',
    },
  ],
}
const template = await readFile(new URL('../../public.html', import.meta.url), 'utf8')
const origin = 'https://sarisari.example'
const parse = (html) => new JSDOM(html).window.document

test('public HTML contains content, one title/description/canonical, social metadata and crawlable links before JavaScript', () => {
  for (const path of ['/', '/pricing']) {
    const document = parse(renderer.renderPage(fixture, path, origin, true, template))
    assert.equal(document.querySelectorAll('title').length, 1)
    assert.equal(document.title, path === '/pricing' ? content.pricing.title : content.home.title)
    assert.equal(document.querySelectorAll('meta[name="description"]').length, 1)
    assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1)
    assert.equal(document.querySelector('link[rel="canonical"]').href, origin + path)
    assert.equal(document.querySelector('meta[property="og:url"]').content, origin + path)
    assert.equal(document.querySelector('meta[name="twitter:card"]').content, 'summary_large_image')
    assert.equal(document.querySelector('link[hreflang="en-PH"]').href, origin + path)
    assert.equal(document.querySelectorAll('h1').length, 1)
    assert.ok(document.querySelector('a[href="/signup?plan=basic"]'))
    assert.ok(document.querySelector('a[href="/pricing"]'))
    const graph = JSON.parse(
      document.querySelector('script[type="application/ld+json"]').textContent,
    )['@graph']
    const application = graph.find((item) => item['@type'] === 'WebApplication')
    assert.deepEqual(
      application.offers.map((item) => item.price),
      ['0.00', '49.00'],
    )
    assert.ok(!JSON.stringify(graph).includes('aggregateRating'))
  }
})

test('metadata and embedded JSON escape content without allowing script or attribute injection', () => {
  const value = structuredClone(fixture)
  value.content.home.title = 'A "title" </title><script>alert(1)</script>'
  value.content.home.headline = '</script><script>malicious()</script>'
  const document = parse(renderer.renderPage(value, '/', origin, true, template))
  assert.equal(document.title, value.content.home.title)
  assert.equal(document.querySelector('h1').textContent, value.content.home.headline)
  assert.equal(document.querySelectorAll('script').length, 3)
  assert.equal(
    JSON.parse(document.getElementById('site-data').textContent).data.content.home.headline,
    value.content.home.headline,
  )
  assert.equal(JSON.parse(serializeJson({ text: '<&>\u2028\u2029' })).text, '<&>\u2028\u2029')
})

test('sitemap only includes indexable canonical public routes with the published last-modified timestamp', () => {
  const document = parse(sitemap(fixture, origin, true))
  assert.deepEqual(
    [...document.querySelectorAll('loc')].map((node) => node.textContent),
    [origin + '/', origin + '/pricing'],
  )
  assert.ok(!sitemap(fixture, origin, true).includes('/dashboard'))
  assert.ok(!sitemap(fixture, origin, false).includes('<loc>'))
  assert.ok(robots(origin, true).includes('Sitemap: ' + origin + '/sitemap.xml'))
  assert.ok(!robots(origin, false).includes('Sitemap:'))
  assert.match(seoHead(fixture, '/', origin, false), /noindex, nofollow/)
})

test('site origin validation rejects credentials and path overrides and indexing requires a public HTTPS origin', () => {
  assert.equal(canonicalUrl(origin, '/pricing'), origin + '/pricing')
  assert.throws(() => canonicalUrl('https://user:pass@sarisari.example', '/'))
  assert.throws(() =>
    siteConfig('/tmp/missing-site-config', 'production', {
      SITE_URL: 'http://localhost:3000',
      SEO_INDEXABLE: 'true',
    }),
  )
  assert.throws(() =>
    siteConfig('/tmp/missing-site-config', 'production', {
      SITE_URL: 'https://sarisari.example/path',
      SEO_INDEXABLE: 'true',
    }),
  )
})

test('the frontend revalidates revisions and preserves a bounded last-known published response during outages', async () => {
  let clock = 0,
    revision = 1,
    failed = false,
    etag
  const load = createSiteLoader('http://api.example', {
    now: () => clock,
    maxStaleMs: 1000,
    fetcher: async (_url, options) => {
      etag = options.headers['If-None-Match']
      if (failed) throw new Error('Offline')
      if (etag === String(revision)) return new Response(null, { status: 304 })
      return new Response(JSON.stringify({ data: { ...fixture, revision: String(revision) } }), {
        headers: { etag: String(revision) },
      })
    },
  })
  assert.equal((await load()).revision, '1')
  assert.equal((await load()).revision, '1')
  assert.equal(etag, '1')
  revision = 2
  assert.equal((await load()).revision, '2')
  failed = true
  clock = 500
  assert.equal((await load()).revision, '2')
  clock = 1001
  await assert.rejects(load())
})

async function requestSite(middleware, path) {
  const result = { status: 200, headers: {}, body: '' }
  const response = {
    setHeader: (name, value) => {
      result.headers[name] = value
    },
    writeHead: (status, headers) => {
      result.status = status
      Object.assign(result.headers, headers)
    },
    end: (body) => {
      result.body = body || ''
    },
  }
  await middleware({ url: path, method: 'GET' }, response, () => {
    result.status = 404
  })
  return result
}
test('publishing a revision refreshes body, metadata and schema together; request hosts and tracking do not change canonical URLs', async () => {
  let data = structuredClone(fixture)
  const middleware = publicMiddleware({
    config: { siteUrl: origin, indexable: true },
    load: async () => data,
    renderer: async () => renderer,
    template: async () => template,
  })
  const first = parse((await requestSite(middleware, '/?utm_source=campaign')).body)
  assert.equal(first.querySelector('link[rel="canonical"]').href, origin + '/')
  data = { ...structuredClone(fixture), revision: 'two' }
  data.content.home.title = 'Published title two'
  data.content.home.headline = 'Published heading two'
  const second = parse((await requestSite(middleware, '/')).body)
  assert.equal(second.title, 'Published title two')
  assert.equal(second.querySelector('h1').textContent, 'Published heading two')
  assert.equal(
    JSON.parse(second.querySelector('script[type="application/ld+json"]').textContent)[
      '@graph'
    ].find((node) => node['@type'] === 'WebPage').name,
    'Published title two',
  )
  const redirect = await requestSite(middleware, '/pricing/?utm_source=campaign')
  assert.equal(redirect.status, 308)
  assert.equal(redirect.headers.Location, '/pricing?utm_source=campaign')
})

test('an unavailable first public response uses HTTP 503 and noindex instead of indexing an empty app shell', async () => {
  const middleware = publicMiddleware({
    config: { siteUrl: origin, indexable: true },
    load: async () => {
      throw new Error('Offline')
    },
    renderer: async () => renderer,
    template: async () => template,
  })
  const result = await requestSite(middleware, '/')
  assert.equal(result.status, 503)
  assert.match(result.headers['X-Robots-Tag'], /noindex/)
})
