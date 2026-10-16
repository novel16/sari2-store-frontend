import { useStoreQuery } from '../hooks/useStoreQuery'
import { loadCategoryOptions, storePath } from './api'

export function useCategoryOptions(storeId?: number, status: 'active' | 'all' = 'active') {
  return useStoreQuery(
    storeId ? `${storePath(storeId)}/categories?status=${status}` : null,
    loadCategoryOptions,
  )
}
