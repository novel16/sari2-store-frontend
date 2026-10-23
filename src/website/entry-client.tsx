import { hydrateRoot } from 'react-dom/client'
import PublicSite from './PublicSite'
import type { PublicSiteData } from './types'
import '../index.css'

const payload = JSON.parse(document.getElementById('site-data')!.textContent!) as {
  data: PublicSiteData
  path: string
}
hydrateRoot(
  document.getElementById('root')!,
  <PublicSite data={payload.data} path={payload.path} />,
)
