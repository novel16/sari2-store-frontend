import { http } from '../../api/http'
import type { CustomerStatement } from './types'

export async function loadStatement(path: string, signal: AbortSignal): Promise<CustomerStatement> {
  let page = 1
  let snapshot: CustomerStatement | null = null
  const entries: CustomerStatement['data'] = []
  do {
    const query = new URLSearchParams({ page: String(page), per_page: '100' })
    if (snapshot) query.set('through_id', String(snapshot.snapshot_id))
    const { data } = await http.get<CustomerStatement>(`${path}?${query}`, { signal })
    if (!snapshot) snapshot = data
    if (data.snapshot_id !== snapshot.snapshot_id || data.customer.id !== snapshot.customer.id)
      throw new Error('The statement changed while loading. Refresh to try again.')
    entries.push(...data.data)
    if (page >= data.meta.last_page) break
    page++
  } while (!signal.aborted)
  if (signal.aborted) throw new DOMException('Statement loading cancelled', 'AbortError')
  return { ...snapshot!, data: entries }
}
