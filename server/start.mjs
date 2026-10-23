import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, dirname, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { siteConfig } from './config.mjs'
import { createSiteLoader, publicMiddleware, unavailablePage } from './public-site.mjs'
import * as renderer from '../dist-server/entry-server.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  dist = resolve(root, 'dist'),
  config = siteConfig(root)
let snapshot = null,
  snapshotAt = 0
try {
  snapshot = JSON.parse(await readFile(resolve(dist, 'site-snapshot.json'), 'utf8'))
  snapshotAt = (await stat(resolve(dist, 'site-snapshot.json'))).mtimeMs
} catch {
  /* A first request can fetch the current published revision. */
}
const template = await readFile(resolve(dist, 'public.html'), 'utf8')
const publicSite = publicMiddleware({
  config,
  load: createSiteLoader(config.apiUrl, { snapshot, snapshotAt }),
  renderer: async () => renderer,
  template: async () => template,
})
const mime = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}
const knownApp =
  /^\/(login|signup|forgot-password|reset-password|dashboard|pos|products|categories|inventory|sales|customers|reports|cash-closing|subscription|settings|website-preview)(\/|$)/
const server = createServer((request, response) => {
  void publicSite(request, response, async () => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' })
        response.end()
        return
      }
      const path = decodeURIComponent(new URL(request.url, 'http://local.invalid').pathname)
      const file = resolve(dist, '.' + path)
      if (
        !file.startsWith(dist + sep) ||
        ['/app.html', '/public.html', '/site-snapshot.json'].includes(path)
      ) {
        response.writeHead(404, { 'X-Robots-Tag': 'noindex' })
        response.end()
        return
      }
      try {
        if ((await stat(file)).isFile()) {
          response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
          response.setHeader(
            'Cache-Control',
            path.startsWith('/assets/')
              ? 'public, max-age=31536000, immutable'
              : 'public, max-age=300',
          )
          response.end(request.method === 'HEAD' ? '' : await readFile(file))
          return
        }
      } catch {
        /* App routes use their own noindex HTML shell. */
      }
      if (!knownApp.test(path)) {
        response.writeHead(404, {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
        })
        response.end(
          '<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>Page not found · Sarisari</title></head><body><h1>Page not found</h1><a href="/">Back to Sarisari</a></body></html>',
        )
        return
      }
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      })
      response.end(
        request.method === 'HEAD' ? '' : await readFile(resolve(dist, 'app.html'), 'utf8'),
      )
    } catch {
      response.writeHead(503, { 'Content-Type': 'text/html', 'X-Robots-Tag': 'noindex' })
      response.end(unavailablePage)
    }
  })
})
server.listen(config.port, config.host, () =>
  process.stdout.write(`Sarisari frontend listening on ${config.host}:${config.port}\n`),
)
