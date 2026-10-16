import { useId, useState } from 'react'
import { ChevronDown, Plus, Search, X } from 'lucide-react'
import { storePath } from '../../catalog/api'
import type { CustomersPageResponse, CustomerSelection } from '../../customers/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { money } from '../../lib/format'

export default function CustomerPicker({
  storeId,
  customer,
  disabled,
  onSelect,
  onAdd,
}: {
  storeId: number
  customer: CustomerSelection | null
  disabled: boolean
  onSelect: (customer: CustomerSelection | null) => void
  onAdd: (name: string) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [highlight, setHighlight] = useState(0)
  const debounced = useDebouncedValue(search)
  const query = new URLSearchParams({ q: debounced, per_page: '10', page: String(page) })
  const result = useStoreQuery<CustomersPageResponse>(
    open ? `${storePath(storeId)}/customers?${query}` : null,
  )
  const loading = result.isLoading || search !== debounced
  const options = loading ? [] : (result.data?.data ?? [])
  const active = Math.min(highlight, Math.max(0, options.length - 1))
  function choose(value: CustomerSelection) {
    onSelect(value)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-semibold" htmlFor={id}>
        Customer for utang *
      </label>
      <div className="flex items-start gap-2">
        <div
          className="relative min-w-0 flex-1"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
          }}
        >
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-3.5 text-stone-400"
            />
            <input
              id={id}
              role="combobox"
              aria-label="Search customer for utang"
              aria-expanded={open}
              aria-controls={`${id}-options`}
              aria-autocomplete="list"
              aria-activedescendant={open && options.length ? `${id}-option-${active}` : undefined}
              className="input !pl-9 !pr-9"
              placeholder="Search name or phone…"
              maxLength={120}
              disabled={disabled}
              autoComplete="off"
              value={open ? search : (customer?.name ?? '')}
              onFocus={() => {
                setSearch('')
                setPage(1)
                setHighlight(0)
                setOpen(true)
              }}
              onClick={() => {
                if (!open) {
                  setSearch('')
                  setPage(1)
                  setHighlight(0)
                  setOpen(true)
                }
              }}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
                setHighlight(0)
                setOpen(true)
                onSelect(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  setOpen(false)
                }
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  setOpen(true)
                  setHighlight((index) =>
                    Math.max(
                      0,
                      Math.min(options.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)),
                    ),
                  )
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  if (open && options[active]) choose(options[active])
                  else setOpen(true)
                }
              }}
            />
            <button
              type="button"
              className="absolute right-1 top-1 grid size-9 place-items-center text-stone-400"
              disabled={disabled}
              aria-label={customer ? 'Clear selected customer' : 'Show customers'}
              onClick={() => {
                if (customer) {
                  onSelect(null)
                  setSearch('')
                }
                setOpen(!open)
                setPage(1)
              }}
            >
              {customer ? <X size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          {open && !disabled && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-stone-200 bg-white shadow-xl">
              <ul
                id={`${id}-options`}
                role="listbox"
                aria-label="Utang customers"
                className="max-h-52 overflow-y-auto py-1"
              >
                {options.map((option, index) => (
                  <li
                    role="option"
                    aria-selected={customer?.id === option.id}
                    id={`${id}-option-${index}`}
                    key={option.id}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      className={`w-full break-words px-3 py-2.5 text-left text-xs ${active === index ? 'bg-forest/5' : 'hover:bg-paper'}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => choose(option)}
                    >
                      <strong className="block">{option.name}</strong>
                      <span className="mt-1 block text-[10px] text-stone-500">
                        {option.phone || `Customer #${option.id}`} ·{' '}
                        {money(option.balance_centavos)} utang
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {loading && (
                <p role="status" className="p-3 text-xs text-stone-500">
                  Searching customers…
                </p>
              )}
              {result.error && (
                <div role="alert" className="p-3 text-xs text-red-700">
                  Could not load customers.{' '}
                  <button type="button" className="underline" onClick={result.reload}>
                    Retry
                  </button>
                </div>
              )}
              {!loading && !result.error && !options.length && (
                <p className="p-3 text-xs text-stone-500">
                  No customers found. Use + to add a new customer.
                </p>
              )}
              {result.data && result.data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-stone-100 p-2 text-[10px]">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => {
                      setPage(page - 1)
                      setHighlight(0)
                    }}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} of {result.data.meta.last_page}
                  </span>
                  <button
                    type="button"
                    disabled={page >= result.data.meta.last_page || loading}
                    onClick={() => {
                      setPage(page + 1)
                      setHighlight(0)
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-secondary !px-3"
          disabled={disabled}
          aria-label="Add new customer for utang"
          title="Add customer"
          onClick={() => {
            setOpen(false)
            onAdd(search)
          }}
        >
          <Plus size={18} />
        </button>
      </div>
      {customer ? (
        <div className="rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
          <strong className="block break-words">{customer.name}</strong>
          {customer.phone && <span className="block">{customer.phone}</span>}
          <span className="mt-1 block">
            Current utang: <strong>{money(customer.balance_centavos)}</strong>
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-stone-500">
          Select a customer before reviewing this utang sale.
        </p>
      )}
    </div>
  )
}
