import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Banknote,
  Download,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  Wallet,
} from 'lucide-react'
import { EmptyState, PageHeader, StatCard } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { Pagination } from '../../components/ui/Pagination'
import FormError from '../../auth/components/FormError'
import { storePath } from '../../catalog/api'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useMutation } from '../../hooks/useMutation'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { money } from '../../lib/format'
import { businessDate } from '../../sales/format'
import type { SalesPageResponse } from '../../sales/types'
import SaleDetailsDialog from './SaleDetailsDialog'
import SalesTable from './SalesTable'
import { exportSales } from './exportSales'
import { useReversal } from '../../sales/reversals/useReversal'
import ReversalDialog from '../../sales/reversals/ReversalDialog'
import SaleSummaryDialog from '../../sales/SaleSummaryDialog'

export default function SalesWorkspace({ userId, storeId }: { userId: number; storeId: number }) {
  const { store } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState(businessDate)
  const [to, setTo] = useState(businessDate)
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')
  const [reversing, setReversing] = useState<number | null>(null)
  const debounced = useDebouncedValue(search)
  const query = new URLSearchParams({ q: debounced, page: String(page), per_page: '20' })
  if (from) query.set('date_from', from)
  if (to) query.set('date_to', to)
  const result = useStoreQuery<SalesPageResponse>(
    store ? `${storePath(store.id)}/sales?${query}` : null,
  )
  const totals = result.data?.meta.summary
  const reversal = useReversal(userId, storeId, () => {
    setReversing(null)
    result.reload()
  })
  const exporting = useMutation()
  const selected = Number(params.get('sale_id'))
  function select(id: number | null) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (id) next.set('sale_id', String(id))
        else next.delete('sale_id')
        return next
      },
      { replace: true },
    )
  }
  async function download() {
    if (store && (await exporting.run(() => exportSales(store.id, query))))
      setNotice('Your filtered sales have been exported.')
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR STORE, EVERY TRANSACTION"
        title="Sales history"
        description="Cash and utang sales, saved with the prices and payment recorded at checkout."
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={result.reload}
              aria-label="Refresh sales"
            >
              <RefreshCw size={15} />
            </button>
            <button
              className="btn btn-secondary"
              disabled={!result.data || exporting.pending}
              onClick={() => void download()}
            >
              <Download size={16} />
              {exporting.pending ? 'Exporting…' : 'Export sales'}
            </button>
            <Link className="btn btn-primary" to="/pos">
              <ShoppingBag size={16} />
              New sale
            </Link>
          </>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Net sales"
          value={totals ? money(totals.net_sales_centavos) : '—'}
          icon={<Wallet size={19} />}
          note="Unreversed sales · Current filter"
        />
        <StatCard
          label="Transactions"
          value={totals ? String(totals.transactions) : '—'}
          icon={<ReceiptText size={19} />}
          note="Completed cash and utang sales"
        />
        <StatCard
          label="Cash collected"
          value={totals ? money(totals.cash_collected_centavos) : '—'}
          icon={<Banknote size={19} />}
          note="Cash received less change"
        />
        <StatCard
          label="Discounts"
          value={totals ? money(totals.discounts_centavos) : '—'}
          icon={<Tag size={19} />}
          note="Discounts recorded at checkout"
        />
      </div>
      {reversal.attempt && reversing === null && (
        <div
          role="status"
          className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950"
        >
          <span>A void/refund for {reversal.attempt.sale_number} needs confirmation.</span>
          <button
            className="btn btn-secondary"
            onClick={() => {
              select(null)
              setReversing(reversal.attempt!.sale_id)
            }}
          >
            Check pending reversal
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="my-4 rounded-lg bg-forest/5 p-4 text-xs text-forest">
          {notice}
        </p>
      )}
      <FormError error={exporting.error} />
      <section className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 p-5">
          <label className="search-field sm:max-w-72">
            <Search size={16} />
            <input
              aria-label="Search sales"
              placeholder="Search sale number…"
              maxLength={120}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="field">
              <span>From </span>
              <input
                aria-label="Sales from date"
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value)
                  setPage(1)
                }}
              />
            </label>
            <label className="field">
              <span>To </span>
              <input
                aria-label="Sales to date"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => {
                  setTo(event.target.value)
                  setPage(1)
                }}
              />
            </label>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFrom('')
                setTo('')
                setPage(1)
              }}
            >
              All dates
            </button>
          </div>
        </div>
        <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
        {result.data && (
          <>
            <SalesTable sales={result.data.data} onSelect={select} />
            {!result.data.data.length && (
              <EmptyState
                title="No sales in this view"
                description="Complete a cash sale or adjust your date and search filters."
                action={
                  <Link className="btn btn-secondary" to="/pos">
                    Open point of sale
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
      {store && Number.isSafeInteger(selected) && selected > 0 && (
        <SaleDetailsDialog
          key={selected}
          storeId={store.id}
          saleId={selected}
          onClose={() => select(null)}
          reversalLocked={Boolean(reversal.attempt) || reversal.pending}
          onReverse={() => {
            select(null)
            reversal.clearError()
            setReversing(selected)
          }}
        />
      )}
      {reversing !== null && (
        <ReversalDialog
          storeId={storeId}
          saleId={reversing}
          state={reversal}
          onClose={() => setReversing(null)}
        />
      )}
      {reversal.receipt && reversing === null && (
        <SaleSummaryDialog
          sale={reversal.receipt.data}
          title="Reversal saved"
          onClose={reversal.closeReceipt}
        />
      )}
    </>
  )
}
