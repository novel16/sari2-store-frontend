import { useState } from 'react'
import { FolderOpen, Plus, RefreshCw, Search } from 'lucide-react'
import { EmptyState, PageHeader } from '../../components/ui'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import { StatusDialog } from '../../components/ui/StatusDialog'
import { catalogApi, storePath } from '../../catalog/api'
import type { Category, PageResponse } from '../../catalog/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useWorkspace } from '../../hooks/useWorkspace'
import CategoryFormDialog from './CategoryFormDialog'
import CategoryCard from './CategoryCard'

export default function CategoriesPage() {
  const { store } = useWorkspace()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'active' | 'archived'>('active')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [statusItem, setStatusItem] = useState<Category | null>(null)
  const [notice, setNotice] = useState('')
  const debounced = useDebouncedValue(search)
  const query = new URLSearchParams({ q: debounced, status, page: String(page), per_page: '12' })
  const result = useStoreQuery<PageResponse<Category>>(
    store ? `${storePath(store.id)}/categories?${query}` : null,
  )
  function saved(message: string) {
    setEditing(null)
    setStatusItem(null)
    setNotice(message)
    result.reload()
  }
  return (
    <>
      <PageHeader
        eyebrow="A PLACE FOR EVERYTHING"
        title="Categories"
        description="Keep your shelves organized and products easy to find."
        actions={
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={result.reload}
              aria-label="Refresh categories"
            >
              <RefreshCw size={15} />
            </button>
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={16} />
              Add category
            </button>
          </div>
        }
      />
      <div className="mb-6 mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="tabs self-start">
          {(['active', 'archived'] as const).map((item) => (
            <button
              key={item}
              className={`tab ${status === item ? 'active' : ''}`}
              onClick={() => {
                setStatus(item)
                setPage(1)
              }}
            >
              {item === 'active' ? 'Active categories' : 'Archived'}
            </button>
          ))}
        </div>
        <label className="search-field sm:w-64">
          <Search size={16} />
          <input
            aria-label="Search categories"
            placeholder="Search categories…"
            maxLength={120}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>
      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-forest/5 px-4 py-3 text-xs text-forest">
          {notice}
        </p>
      )}
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.data.data.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={() => setEditing(category)}
                onStatus={() => setStatusItem(category)}
              />
            ))}
          </div>
          {!result.data.data.length && (
            <div className="panel">
              <EmptyState
                title={status === 'archived' ? 'No archived categories' : 'No categories yet'}
                description="Create a category or try a different search."
                action={
                  <button className="btn btn-secondary" onClick={() => setEditing('new')}>
                    Add category
                  </button>
                }
              />
            </div>
          )}
          <Pagination meta={result.data.meta} onPage={setPage} />
        </>
      )}
      <div className="mt-6 flex items-center gap-2 text-[10px] text-stone-500">
        <FolderOpen size={14} />
        Reassign active products before archiving a category.
      </div>
      {editing && store && (
        <CategoryFormDialog
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
            catalogApi.setCategoryStatus(
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
