import { http, writeWithCsrf } from '../api/http'
import type {
  AdjustmentInput,
  Category,
  CategoryInput,
  Movement,
  PageResponse,
  Product,
  ProductInput,
  RecordStatus,
} from './types'

export const storePath = (storeId: number) => `/api/v1/stores/${storeId}`

export const catalogApi = {
  saveProduct(storeId: number, input: ProductInput, id?: number) {
    return writeWithCsrf<{ data: Product }>(
      id ? 'patch' : 'post',
      `${storePath(storeId)}/products${id ? `/${id}` : ''}`,
      input,
    )
  },
  setProductStatus(storeId: number, id: number, status: RecordStatus) {
    return writeWithCsrf<{ data: Product }>(
      status === 'archived' ? 'delete' : 'patch',
      `${storePath(storeId)}/products/${id}`,
      status === 'active' ? { status } : undefined,
    )
  },
  saveCategory(storeId: number, input: CategoryInput, id?: number) {
    return writeWithCsrf<{ data: Category }>(
      id ? 'patch' : 'post',
      `${storePath(storeId)}/categories${id ? `/${id}` : ''}`,
      input,
    )
  },
  setCategoryStatus(storeId: number, id: number, status: RecordStatus) {
    return writeWithCsrf<{ data: Category }>(
      status === 'archived' ? 'delete' : 'patch',
      `${storePath(storeId)}/categories/${id}`,
      status === 'active' ? { status } : undefined,
    )
  },
  adjustStock(storeId: number, input: AdjustmentInput) {
    return writeWithCsrf<{ data: Movement; product: Product; meta: { replayed: boolean } }>(
      'post',
      `${storePath(storeId)}/inventory/adjustments`,
      input,
    )
  },
}

export async function loadCategoryOptions(path: string, signal: AbortSignal): Promise<Category[]> {
  const categories: Category[] = []
  let page = 1
  let last: number
  do {
    const response = await http.get<PageResponse<Category>>(path, {
      params: { per_page: 100, page },
      signal,
    })
    categories.push(...response.data.data)
    last = response.data.meta.last_page
    page += 1
  } while (page <= last)
  return categories
}
