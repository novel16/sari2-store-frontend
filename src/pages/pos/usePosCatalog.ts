import { useState } from 'react'
import { storePath } from '../../catalog/api'
import type { PageResponse, Product } from '../../catalog/types'
import { useCategoryOptions } from '../../catalog/useCategoryOptions'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useStoreQuery } from '../../hooks/useStoreQuery'

export function usePosCatalog(storeId: number) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const categories = useCategoryOptions(storeId)
  const debounced = useDebouncedValue(search)
  const query = new URLSearchParams({ q: debounced, page: String(page), per_page: '24' })
  if (category) query.set('category_id', category)
  const result = useStoreQuery<PageResponse<Product>>(`${storePath(storeId)}/products?${query}`)
  return {
    ...result,
    search,
    category,
    categories,
    setPage,
    onSearch: (value: string) => {
      setSearch(value)
      setPage(1)
    },
    onCategory: (value: string) => {
      setCategory(value)
      setPage(1)
    },
  }
}
