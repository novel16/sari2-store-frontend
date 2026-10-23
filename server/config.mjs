import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'

export function siteConfig(root, mode = 'production', environment = process.env) {
  const values = {}
  for (const name of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    try {
      Object.assign(
        values,
        parseEnv(readFileSync(resolve(root, name), 'utf8').replace(/^\uFEFF/, '')),
      )
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  Object.assign(values, environment)
  const site = new URL(values.SITE_URL || values.VITE_SITE_URL || 'http://localhost:3000')
  if (
    !['http:', 'https:'].includes(site.protocol) ||
    site.username ||
    site.password ||
    site.pathname !== '/' ||
    site.search ||
    site.hash
  )
    throw new Error('SITE_URL must be an HTTP(S) origin.')
  const indexable = values.SEO_INDEXABLE === 'true'
  if (
    indexable &&
    (site.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(site.hostname))
  )
    throw new Error('Indexing requires a public HTTPS SITE_URL.')
  const api = new URL(values.PUBLIC_API_URL || values.VITE_API_URL || 'http://localhost:8000')
  if (!['http:', 'https:'].includes(api.protocol) || api.username || api.password)
    throw new Error('Invalid public API origin.')
  return {
    siteUrl: site.origin,
    apiUrl: api.href.replace(/\/$/, ''),
    indexable,
    port: Number(values.PORT || 3000),
    host: values.HOST || '127.0.0.1',
  }
}
