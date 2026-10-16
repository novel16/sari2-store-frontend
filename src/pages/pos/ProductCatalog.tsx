import { Plus, RefreshCw, Search } from 'lucide-react'
import { EmptyState } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { Pagination } from '../../components/ui/Pagination'
import type { Product } from '../../catalog/types'
import { money } from '../../lib/format'
import type { usePosCatalog } from './usePosCatalog'

export default function ProductCatalog({
  catalog,
  onAdd,
  disabled,
}: {
  catalog: ReturnType<typeof usePosCatalog>
  onAdd: (product: Product) => void
  disabled: boolean
}) {
  return (
    <section className="min-w-0">
      <label className="search-field mb-4 !min-h-12 !bg-white">
        <Search size={18} />
        <input
          aria-label="Search point of sale products"
          placeholder="Find a product by name, SKU or barcode…"
          maxLength={120}
          value={catalog.search}
          onChange={(event) => catalog.onSearch(event.target.value)}
        />
      </label>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        <button
          className={`btn ${catalog.category ? 'btn-secondary' : 'btn-primary'} shrink-0`}
          onClick={() => catalog.onCategory('')}
        >
          All items
        </button>
        {catalog.categories.data?.map((category) => (
          <button
            className={`btn ${catalog.category === String(category.id) ? 'btn-primary' : 'btn-secondary'} shrink-0`}
            key={category.id}
            onClick={() => catalog.onCategory(String(category.id))}
          >
            {category.name}
          </button>
        ))}
      </div>
      {catalog.categories.error && (
        <p role="alert" className="mb-3 text-xs text-red-700">
          Categories could not load.{' '}
          <button className="underline" onClick={catalog.categories.reload}>
            Retry
          </button>
        </p>
      )}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold">On your shelves</h2>
        <button className="icon-button" aria-label="Refresh POS products" onClick={catalog.reload}>
          <RefreshCw size={15} />
        </button>
      </div>
      <QueryState loading={catalog.isLoading} error={catalog.error} retry={catalog.reload} />
      {catalog.data && (
        <>
          <div className="grid grid-cols-2 gap-3 min-[580px]:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {catalog.data.data.map((product) => (
              <button
                key={product.id}
                aria-label={`Add ${product.name} to cart`}
                onClick={() => onAdd(product)}
                disabled={disabled || product.inventory.quantity_on_hand === 0}
                className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition hover:border-forest/30 hover:shadow-md disabled:opacity-50"
              >
                <span
                  className="relative flex h-29 items-center justify-center text-5xl"
                  style={{ background: product.color }}
                >
                  <span aria-hidden="true">{product.emoji}</span>
                  <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-1 text-[9px] text-stone-600">
                    {product.inventory.quantity_on_hand === 0
                      ? 'Sold out'
                      : `${product.inventory.quantity_on_hand} left`}
                  </span>
                </span>
                <span className="block p-3">
                  <strong className="block min-h-8 break-words text-[11px] leading-relaxed">
                    {product.name}
                  </strong>
                  <span className="mt-1 block truncate text-[10px] text-stone-500">
                    {product.description || product.sku || product.unit}
                  </span>
                  <span className="mt-3 flex flex-wrap items-center justify-between gap-1">
                    <strong className="text-sm text-forest">{money(product.price_centavos)}</strong>
                    <Plus size={16} className="text-forest" />
                  </span>
                </span>
              </button>
            ))}
          </div>
          {!catalog.data.data.length && (
            <div className="panel">
              <EmptyState
                title="No products found"
                description="Add products to your catalog or try another search."
                action={
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      catalog.onSearch('')
                      catalog.onCategory('')
                    }}
                  >
                    Show all products
                  </button>
                }
              />
            </div>
          )}
          <Pagination meta={catalog.data.meta} onPage={catalog.setPage} />
        </>
      )}
    </section>
  )
}
