import { renderToString } from 'react-dom/server'
import PublicSite from './PublicSite'
import { seoHead, serializeJson } from './seo'
import type { PublicSiteData } from './types'

export { sitemap, robots, publicPaths } from './seo'

export function renderPage(
  data: PublicSiteData,
  path: string,
  siteUrl: string,
  indexable: boolean,
  template: string,
) {
  return template
    .replace('<!--seo-->', seoHead(data, path, siteUrl, indexable))
    .replace('<!--public-html-->', renderToString(<PublicSite data={data} path={path} />))
    .replace('<!--site-data-->', serializeJson({ data, path, siteUrl, indexable }))
}
