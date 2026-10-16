import { http, writeWithCsrf } from '../../api/http'
import { storePath } from '../../catalog/api'
import type { ReversalInput, ReversalQuote, ReversalReply } from './types'

export const reversalApi = {
  async preview(storeId: number, saleId: number) {
    return (
      await http.get<{ data: ReversalQuote }>(
        `${storePath(storeId)}/sales/${saleId}/reversal-preview`,
      )
    ).data.data
  },
  record: (storeId: number, saleId: number, input: ReversalInput) =>
    writeWithCsrf<ReversalReply>('post', `${storePath(storeId)}/sales/${saleId}/reversals`, input),
  async byKey(storeId: number, key: string) {
    return (
      await http.get<ReversalReply>(
        `${storePath(storeId)}/sale-reversals/by-key/${encodeURIComponent(key)}`,
      )
    ).data
  },
}
