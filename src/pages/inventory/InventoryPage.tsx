import { useState } from 'react'
import { AlertTriangle, Download, History, Layers, Package, RefreshCw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, PageHeader, StatCard } from '../../components/ui'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import FormError from '../../auth/components/FormError'
import { storePath } from '../../catalog/api'
import type { PageResponse, Product } from '../../catalog/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useMutation } from '../../hooks/useMutation'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useWorkspace } from '../../hooks/useWorkspace'
import { money } from '../../lib/format'
import StockAdjustmentDialog from './StockAdjustmentDialog'
import InventoryHistoryDialog from './InventoryHistoryDialog'
import InventoryTable from './InventoryTable'
import { exportInventory } from './exportInventory'

export default function InventoryPage() {
  const { store } = useWorkspace()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [adjusting, setAdjusting] = useState<Product | null>(null)
  const [history, setHistory] = useState<Product | 'all' | null>(null)
  const [notice, setNotice] = useState('')
  const debounced = useDebouncedValue(search)
  const query = new URLSearchParams({
    q: debounced,
    stock: filter,
    page: String(page),
    per_page: '20',
  })
  const result = useStoreQuery<PageResponse<Product>>(
    store ? `${storePath(store.id)}/inventory?${query}` : null,
  )
  const summary = result.data?.meta.summary
  const exporting = useMutation()
  async function download() {
    if (store && (await exporting.run(() => exportInventory(store.id, query))))
      setNotice('Your filtered inventory has been exported.')
  }
  function reloadStock() {
    setAdjusting(null)
    result.reload()
  }
  return (
    <>
      <PageHeader
        eyebrow="KNOW WHAT’S ON YOUR SHELVES"
        title="Inventory"
        description="A clear view of your stock, down to the last sachet."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-secondary"
              onClick={result.reload}
              aria-label="Refresh inventory"
            >
              <RefreshCw size={15} />
            </button>
            <button className="btn btn-secondary" onClick={() => setHistory('all')}>
              <History size={15} />
              Movement history
            </button>
            <button
              className="btn btn-secondary"
              disabled={exporting.pending || !result.data}
              onClick={() => void download()}
            >
              <Download size={15} />
              {exporting.pending ? 'Exporting…' : 'Export stock'}
            </button>
          </div>
        }
      />
      <div className="mb-6 mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total units on hand"
          value={summary ? summary.total_units.toLocaleString() : '—'}
          icon={<Package size={18} />}
          note={
            summary ? `Across ${summary.active_products} active products` : 'Your store inventory'
          }
        />
        <StatCard
          label="Needs a refill"
          value={summary ? String(summary.low_stock + summary.out_of_stock).padStart(2, '0') : '—'}
          icon={<AlertTriangle size={18} />}
          note="Low-stock and out-of-stock products"
        />
        <StatCard
          label="Inventory value"
          value={summary ? money(summary.inventory_value_centavos) : '—'}
          icon={<Layers size={18} />}
          note="Active products at recorded cost"
        />
      </div>
      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-forest/5 px-4 py-3 text-xs text-forest">
          {notice}
        </p>
      )}
      <FormError error={exporting.error} />
      <section className="panel">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="tabs max-w-full flex-wrap self-start">
            {[
              ['all', 'All stock'],
              ['low', 'Low stock'],
              ['out', 'Out of stock'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`tab ${filter === key ? 'active' : ''}`}
                onClick={() => {
                  setFilter(key)
                  setPage(1)
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="search-field sm:w-60">
            <Search size={15} />
            <input
              aria-label="Search inventory"
              placeholder="Search inventory…"
              maxLength={120}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </label>
        </div>
        <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
        {result.data && (
          <>
            <InventoryTable
              products={result.data.data}
              onAdjust={setAdjusting}
              onHistory={setHistory}
            />
            {!result.data.data.length && (
              <EmptyState
                title="No products in this view"
                description="Add products to your catalog or try another filter."
                action={
                  <Link className="btn btn-secondary" to="/products">
                    Open products
                  </Link>
                }
              />
            )}
            <div className="border-t border-stone-100 px-5 pb-5">
              <Pagination meta={result.data.meta} onPage={setPage} />
            </div>
          </>
        )}
      </section>
      {adjusting && store && (
        <StockAdjustmentDialog
          storeId={store.id}
          adjusting={adjusting}
          onClose={() => setAdjusting(null)}
          onReload={reloadStock}
          onSaved={() => {
            setNotice(`${adjusting.name}: stock adjustment saved.`)
            reloadStock()
          }}
        />
      )}
      {history && store && (
        <InventoryHistoryDialog
          storeId={store.id}
          product={history === 'all' ? null : history}
          onClose={() => setHistory(null)}
        />
      )}
    </>
  )
}
