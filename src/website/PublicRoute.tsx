import { useEffect, useState } from 'react'
import PublicSite from './PublicSite'
import type { PublicSiteData } from './types'
import { seoHead } from './seo'

export default function PublicRoute({ preview = false }: { preview?: boolean }) {
  const [data, setData] = useState<PublicSiteData | null>(null),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const api = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
    void fetch(api + (preview ? '/api/v1/admin/website/preview' : '/api/v1/public/site'), {
      signal: controller.signal,
      credentials: preview ? 'include' : 'omit',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unavailable')
        return response.json()
      })
      .then((reply: { data: PublicSiteData }) => {
        if (!controller.signal.aborted) setData(reply.data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [preview])
  useEffect(() => {
    if (!data) return
    const existing = [
      ...document.head.querySelectorAll(
        'title,meta[name="description"],meta[name="robots"],link[rel="canonical"]',
      ),
    ]
    existing.forEach((node) => node.remove())
    const head = new DOMParser().parseFromString(
      seoHead(data, window.location.pathname, window.location.origin, false),
      'text/html',
    ).head
    const nodes = [...head.children]
    nodes.forEach((node) => document.head.append(node))
    return () => {
      nodes.forEach((node) => node.remove())
      existing.forEach((node) => document.head.append(node))
    }
  }, [data])
  if (failed)
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-bold">
          {preview ? 'Preview is unavailable' : 'We will be right back.'}
        </h1>
        <p className="my-5">
          {preview
            ? 'Save your draft and sign in as an active administrator in this browser before opening the preview.'
            : 'Please refresh to try again.'}
        </p>
        <a href={preview ? '/' : '/login'} className="btn btn-primary">
          {preview ? 'View live website' : 'Sign in'}
        </a>
      </main>
    )
  return data ? (
    <PublicSite data={data} path={preview ? '/' : window.location.pathname} preview={preview} />
  ) : (
    <div className="grid min-h-dvh place-items-center" role="status">
      Loading Sarisari…
    </div>
  )
}
