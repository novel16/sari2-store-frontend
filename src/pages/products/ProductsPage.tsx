import { useState } from 'react'
import { ArrowUpRight, Plus, RefreshCw, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader } from '../../components/ui'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import { StatusDialog } from '../../components/ui/StatusDialog'
import { catalogApi, storePath } from '../../catalog/api'
import type { PageResponse, Product } from '../../catalog/types'
import { useCategoryOptions } from '../../catalog/useCategoryOptions'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useWorkspace } from '../../hooks/useWorkspace'
import ProductCard from './ProductCard'
import ProductFormDialog from './ProductFormDialog'

export default function ProductsPage() {
  const { store } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const debounced = useDebouncedValue(search)
  const view = params.get('view') ?? 'all'
  const category = params.get('category_id') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [statusItem, setStatusItem] = useState<Product | null>(null)
  const [notice, setNotice] = useState('')
  const categories = useCategoryOptions(store?.id, 'all')
  const query = new URLSearchParams({
    q: debounced,
    page: String(page),
    per_page: '24',
    status: view === 'archived' ? 'archived' : 'active',
    stock: view === 'low' || view === 'out' ? view : 'all',
  })
  if (category) query.set('category_id', category)
  const result = useStoreQuery<PageResponse<Product>>(
    store ? `${storePath(store.id)}/products?${query}` : null,
  )
  const summary = result.data?.meta.summary
  const quota = result.data?.meta.quota
  function change(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: true },
    )
  }
  function saved(message: string) {
    setEditing(null)
    setStatusItem(null)
    setNotice(message)
    result.reload()
  }

  return (
    <>
      <PageHeader
        eyebrow="THE LITTLE THINGS YOU STOCK"
        title="Products"
        description="Your everyday essentials, all in one place."
        actions={
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={result.reload}
              aria-label="Refresh products"
            >
              <RefreshCw size={15} />
            </button>
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={16} />
              Add product
            </button>
          </div>
        }
      />
      <div className="mb-6 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3e9dc] bg-[#eff3e9] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/80 text-[#80936b]">
            <Sparkles size={16} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-forest">A growing little store</p>
            <p className="mt-1 text-[10px] text-[#7f8b74]">
              {quota
                ? `${quota.active_products}${quota.active_product_limit === null ? '' : ` of ${quota.active_product_limit}`} active products on your ${quota.plan_name} plan.`
                : 'Your saved catalog and product allowance.'}
            </p>
          </div>
        </div>
        <Link to="/subscription" className="section-link">
          Explore plans
          <ArrowUpRight size={13} />
        </Link>
      </div>
      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-forest/5 px-4 py-3 text-xs text-forest">
          {notice}
        </p>
      )}
      <div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="tabs max-w-full flex-wrap self-start">
          {[
            ['all', 'All products', summary?.active_products],
            ['low', 'Low stock', summary?.low_stock],
            ['out', 'Out of stock', summary?.out_of_stock],
            ['archived', 'Archived', summary?.archived_products],
          ].map(([key, label, count]) => (
            <button
              className={`tab ${view === key ? 'active' : ''}`}
              key={key}
              onClick={() => change('view', String(key))}
            >
              {label}
              {count !== undefined && (
                <span className="rounded bg-forest/5 px-1.5 py-0.5 text-[9px]">{count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="search-field sm:w-60">
            <Search size={15} />
            <input
              aria-label="Search products"
              placeholder="Search name, SKU or barcode…"
              maxLength={120}
              value={search}
              onChange={(event) => change('q', event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-stone-400">
            <SlidersHorizontal size={14} />
            <select
              className="min-h-10 max-w-44 bg-transparent text-[11px] text-ink outline-none"
              aria-label="Filter by category"
              value={category}
              onChange={(event) => change('category_id', event.target.value)}
            >
              <option value="">All categories</option>
              {categories.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.status === 'archived' ? ' (archived)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {categories.error && (
        <p role="alert" className="mb-3 text-xs text-red-700">
          Categories could not load.{' '}
          <button className="underline" onClick={categories.reload}>
            Retry categories
          </button>
        </p>
      )}
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {result.data.data.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => setEditing(product)}
                onStatus={() => setStatusItem(product)}
              />
            ))}
          </div>
          {result.data.data.length === 0 && (
            <div className="panel">
              <EmptyState
                title={view === 'archived' ? 'No archived products' : 'No products in this view'}
                description="Add your first product or try a different filter."
                action={
                  <button className="btn btn-secondary" onClick={() => setParams({})}>
                    Reset filters
                  </button>
                }
              />
            </div>
          )}
          <Pagination meta={result.data.meta} onPage={(next) => change('page', String(next))} />
        </>
      )}
      {editing && store && (
        <ProductFormDialog
          storeId={store.id}
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={(name) => saved(`${name} saved to your store.`)}
        />
      )}
      {statusItem && store && (
        <StatusDialog
          name={statusItem.name}
          archived={statusItem.status === 'archived'}
          action={() =>
            catalogApi.setProductStatus(
              store.id,
              statusItem.id,
              statusItem.status === 'active' ? 'archived' : 'active',
            )
          }
          onClose={() => setStatusItem(null)}
          onSaved={() =>
            saved(`${statusItem.name} ${statusItem.status === 'active' ? 'archived' : 'restored'}.`)
          }
        />
      )}
    </>
  )
}
