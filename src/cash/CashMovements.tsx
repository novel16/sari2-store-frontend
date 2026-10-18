import { useState } from 'react'
import { QueryState } from '../components/ui/QueryState'
import { Pagination } from '../components/ui/Pagination'
import { useStoreQuery } from '../hooks/useStoreQuery'
import { money } from '../lib/format'
import { cashPath } from './api'
import { cashDateTime } from './format'
import type { CashMovement, CashPage } from './types'

export default function CashMovements({ storeId, dayId }: { storeId: number; dayId: number }) {
  const [page, setPage] = useState(1)
  const result = useStoreQuery<CashPage<CashMovement>>(
    cashPath(storeId) + '/' + dayId + '/movements?page=' + page + '&per_page=10',
  )
  return (
    <section className="panel mt-6 overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-5">
        <h2 className="font-bold">Manual cash movements</h2>
        <button className="btn btn-secondary" disabled={result.isLoading} onClick={result.reload}>
          Refresh movements
        </button>
      </div>
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          {result.data.data.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recorded</th>
                    <th>Movement</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.data.map((item) => (
                    <tr key={item.id}>
                      <td>{cashDateTime(item.created_at)}</td>
                      <td>Cash {item.direction}</td>
                      <td className="font-semibold tabular-nums">
                        {item.direction === 'out' ? '- ' : '+ '}
                        {money(item.amount_centavos)}
                      </td>
                      <td className="max-w-72 whitespace-pre-wrap break-words">{item.reason}</td>
                      <td>{item.actor.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 pb-5 text-sm text-stone-500">
              No manual cash movements recorded for this day.
            </p>
          )}
          <div className="px-5 pb-5">
            <Pagination meta={result.data.meta} onPage={setPage} />
          </div>
        </>
      )}
    </section>
  )
}
