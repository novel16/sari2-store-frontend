import { useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, Modal, ProductArt } from '../ui'
import { QueryState } from '../ui/QueryState'
import { navigation } from '../../config/navigation'
import { storePath } from '../../catalog/api'
import type { PageResponse, Product } from '../../catalog/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useWorkspace } from '../../hooks/useWorkspace'
import { money } from '../../lib/format'

export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const query = useDebouncedValue(search.trim())
  const { store } = useWorkspace()
  const navigate = useNavigate()
  const pages = navigation.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
  const result = useStoreQuery<PageResponse<Product>>(
    store && query
      ? `${storePath(store.id)}/products?${new URLSearchParams({ q: query, per_page: '4' })}`
      : null,
  )
  const go = (path: string) => {
    onClose()
    navigate(path)
  }
  return (
    <Modal title="Find your way" onClose={onClose}>
      <div className="search-field mb-5">
        <Search size={17} />
        <input
          aria-label="Search workspace"
          placeholder="Search pages or your products…"
          maxLength={120}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {pages.length > 0 && (
        <>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Pages
          </p>
          <div className="grid gap-1">
            {pages.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className="flex items-center gap-3 rounded-lg p-3 text-left text-xs transition hover:bg-paper"
              >
                <item.icon size={17} className="text-forest" />
                <span className="flex-1">{item.label}</span>
                <ArrowUpRight size={14} className="text-stone-400" />
              </button>
            ))}
          </div>
        </>
      )}
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {!!result.data?.data.length && (
        <>
          <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Your products
          </p>
          {result.data.data.map((product) => (
            <button
              key={product.id}
              onClick={() => go(`/products?q=${encodeURIComponent(product.name)}`)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-paper"
            >
              <ProductArt product={product} small />
              <span className="flex-1 text-xs">{product.name}</span>
              <span className="text-xs font-bold">{money(product.price_centavos)}</span>
            </button>
          ))}
        </>
      )}
      {pages.length === 0 && result.data?.data.length === 0 && (
        <EmptyState
          title="No matches yet"
          description="Try a page name, SKU, barcode, or product on your shelves."
        />
      )}
    </Modal>
  )
}
