import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { siteConfig } from './config.mjs'
import { createSiteLoader, publicMiddleware } from './public-site.mjs'

export function publicWebsite() {
  return {
    name: 'sarisari-public-website',
    configureServer(server) {
      const config = siteConfig(server.config.root, server.config.mode)
      server.middlewares.use(
        publicMiddleware({
          config: { ...config, cacheHtml: false },
          load: createSiteLoader(config.apiUrl),
          renderer: () => server.ssrLoadModule('/src/website/entry-server.tsx'),
          template: async (url) =>
            server.transformIndexHtml(
              url,
              await readFile(resolve(server.config.root, 'public.html'), 'utf8'),
            ),
        }),
      )
    },
  }
}
