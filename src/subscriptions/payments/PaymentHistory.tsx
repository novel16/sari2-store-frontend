import { useState } from 'react'
import { QueryState } from '../../components/ui/QueryState'
import { Pagination } from '../../components/ui/Pagination'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { money } from '../../lib/format'
import { ordersPath } from './api'
import { orderMessage, paymentDate } from './checkout'
import type { PaymentHistory as HistoryReply } from './types'

export default function PaymentHistory({
  storeId,
  onSelect,
}: {
  storeId: number
  onSelect: (id: string) => void
}) {
  const [page, setPage] = useState(1)
  const result = useStoreQuery<HistoryReply>(`${ordersPath(storeId)}?page=${page}&per_page=10`)
  return (
    <section className="panel mt-7 p-5 sm:p-6" aria-label="Subscription payment history">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-forest">Subscription payment history</h2>
        <button className="btn btn-secondary" disabled={result.isLoading} onClick={result.reload}>
          Refresh history
        </button>
      </div>
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          {!result.data.data.length && (
            <p className="py-8 text-center text-sm text-stone-500">No subscription payments yet.</p>
          )}
          <ol className="divide-y divide-stone-100">
            {result.data.data.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {order.plan.name} · {order.months} month(s) · {money(order.amount_centavos)}
                  </p>
                  <p className="mt-1 text-stone-500">{orderMessage(order)}</p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    {paymentDate(order.created_at)} PHT
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => onSelect(order.id)}>
                  View payment
                </button>
              </li>
            ))}
          </ol>
          <Pagination meta={result.data.meta} onPage={setPage} />
        </>
      )}
    </section>
  )
}
