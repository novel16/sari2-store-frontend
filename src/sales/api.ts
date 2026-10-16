import { http, writeWithCsrf } from '../api/http'
import { storePath } from '../catalog/api'
import type { PageResponse, Product } from '../catalog/types'
import type { CheckoutInput, CheckoutResult, SaleDetail } from './types'

export const salesApi = {
  checkout: (storeId: number, input: CheckoutInput) =>
    writeWithCsrf<CheckoutResult>('post', `${storePath(storeId)}/sales`, input),
  async byKey(storeId: number, key: string) {
    return (
      await http.get<{ data: SaleDetail }>(
        `${storePath(storeId)}/sales/by-key/${encodeURIComponent(key)}`,
      )
    ).data.data
  },
  async products(storeId: number, ids: number[]) {
    const query = new URLSearchParams({ status: 'all', per_page: '100' })
    ids.forEach((id) => query.append('ids[]', String(id)))
    return (await http.get<PageResponse<Product>>(`${storePath(storeId)}/products?${query}`)).data
      .data
  },
}
