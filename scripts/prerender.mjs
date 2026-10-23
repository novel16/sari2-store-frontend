import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { siteConfig } from '../server/config.mjs'
import { createSiteLoader, unavailablePage } from '../server/public-site.mjs'
import { renderPage, sitemap, robots, publicPaths } from '../dist-server/entry-server.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  dist = resolve(root, 'dist'),
  config = siteConfig(root)
await writeFile(resolve(dist, 'app.html'), await readFile(resolve(dist, 'index.html'), 'utf8'))
const template = await readFile(resolve(dist, 'public.html'), 'utf8')
try {
  const data = await createSiteLoader(config.apiUrl)()
  await writeFile(resolve(dist, 'site-snapshot.json'), JSON.stringify(data))
  for (const path of publicPaths) {
    const directory = path === '/' ? dist : resolve(dist, path.slice(1))
    await mkdir(directory, { recursive: true })
    await writeFile(
      resolve(directory, 'index.html'),
      renderPage(data, path, config.siteUrl, config.indexable, template),
    )
  }
  await writeFile(resolve(dist, 'sitemap.xml'), sitemap(data, config.siteUrl, config.indexable))
  process.stdout.write('Prerendered public pages from the published API revision.\n')
} catch {
  if (config.indexable)
    throw new Error(
      'An indexable build requires the published website API. Start the API and apply the website migration first.',
    )
  await writeFile(resolve(dist, 'index.html'), unavailablePage)
  process.stdout.write(
    'API unavailable: generated a noindex maintenance snapshot. The frontend server will load published content when available.\n',
  )
}
await writeFile(resolve(dist, 'robots.txt'), robots(config.siteUrl, config.indexable))
