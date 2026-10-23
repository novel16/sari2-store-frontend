export const publicPaths = ['/', '/pricing']
export const unavailablePage =
  '<!doctype html><html lang="en-PH"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Sarisari — temporarily unavailable</title></head><body><main><h1>We will be right back.</h1><p>The website is temporarily unavailable. Please try again shortly.</p><a href="/login">Sign in to your store</a></main></body></html>'

export function createSiteLoader(
  apiUrl,
  {
    fetcher = fetch,
    now = Date.now,
    snapshot = null,
    snapshotAt = now(),
    maxStaleMs = 24 * 60 * 60 * 1000,
  } = {},
) {
  let cached = snapshot,
    etag = null,
    checkedAt = snapshot ? snapshotAt : 0,
    pending = null
  return async function load() {
    if (pending) return pending
    pending = (async () => {
      try {
        const response = await fetcher(apiUrl + '/api/v1/public/site', {
          headers: { Accept: 'application/json', ...(etag ? { 'If-None-Match': etag } : {}) },
          signal: AbortSignal.timeout(8000),
        })
        if (response.status === 304 && cached) {
          checkedAt = now()
          return cached
        }
        if (!response.ok) throw new Error('Public content unavailable')
        const { data } = await response.json()
        if (!data?.revision || !data?.content?.home?.title || !Array.isArray(data.plans))
          throw new Error('Invalid public content')
        cached = data
        etag = response.headers.get('etag')
        checkedAt = now()
        return cached
      } catch (error) {
        if (cached && now() - checkedAt <= maxStaleMs) return cached
        throw error
      } finally {
        pending = null
      }
    })()
    return pending
  }
}

export function publicMiddleware({ config, load, renderer, template }) {
  let revision = '',
    pages = new Map()
  return async (request, response, next) => {
    const url = new URL(request.url, 'http://local.invalid'),
      path = url.pathname
    if (
      !['GET', 'HEAD'].includes(request.method) ||
      ![
        ...publicPaths,
        '/pricing/',
        '/index.html',
        '/pricing/index.html',
        '/robots.txt',
        '/sitemap.xml',
      ].includes(path)
    )
      return next()
    if (['/index.html', '/pricing/index.html'].includes(path)) {
      response.writeHead(308, { Location: path === '/index.html' ? '/' : '/pricing' })
      response.end()
      return
    }
    if (path === '/pricing/') {
      response.writeHead(308, { Location: '/pricing' + url.search })
      response.end()
      return
    }
    try {
      const render = await renderer()
      if (path === '/robots.txt') {
        response.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        })
        response.end(
          request.method === 'HEAD' ? '' : render.robots(config.siteUrl, config.indexable),
        )
        return
      }
      const data = await load()
      response.setHeader('Cache-Control', 'no-cache')
      if (!config.indexable) response.setHeader('X-Robots-Tag', 'noindex, nofollow')
      if (path === '/sitemap.xml') {
        response.setHeader('Content-Type', 'application/xml; charset=utf-8')
        response.end(
          request.method === 'HEAD' ? '' : render.sitemap(data, config.siteUrl, config.indexable),
        )
        return
      }
      const source = await template(request.url)
      const key = data.revision + ':' + config.siteUrl + ':' + config.indexable
      if (key !== revision || config.cacheHtml === false) {
        revision = key
        pages = new Map()
      }
      // The same published revision supplies body, metadata and structured data.
      const cacheKey = path + ':' + source
      if (!pages.has(cacheKey))
        pages.set(cacheKey, render.renderPage(data, path, config.siteUrl, config.indexable, source))
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      response.end(request.method === 'HEAD' ? '' : pages.get(cacheKey))
    } catch {
      response.writeHead(503, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Retry-After': '30',
        'Cache-Control': 'no-store',
      })
      response.end(request.method === 'HEAD' ? '' : unavailablePage)
    }
  }
}
