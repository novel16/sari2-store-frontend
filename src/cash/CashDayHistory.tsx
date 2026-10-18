import { useState } from 'react'
import { QueryState } from '../components/ui/QueryState'
import { Pagination } from '../components/ui/Pagination'
import { useStoreQuery } from '../hooks/useStoreQuery'
import { money } from '../lib/format'
import { cashPath } from './api'
import { varianceText } from './format'
import type { CashDay, CashPage } from './types'

export default function CashDayHistory({
  storeId,
  onSelect,
}: {
  storeId: number
  onSelect: (id: number) => void
}) {
  const [page, setPage] = useState(1)
  const result = useStoreQuery<CashPage<CashDay>>(
    cashPath(storeId) + '?page=' + page + '&per_page=10',
  )
  return (
    <section className="panel mt-6 overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-5">
        <h2 className="font-bold">Cash day history</h2>
        <button className="btn btn-secondary" disabled={result.isLoading} onClick={result.reload}>
          Refresh history
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
                    <th>Business date</th>
                    <th>Status</th>
                    <th>Opening cash</th>
                    <th>Closing difference</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.data.map((day) => (
                    <tr key={day.id}>
                      <td className="font-semibold">{day.business_date}</td>
                      <td>{day.status === 'closed' ? 'Final' : 'Open'}</td>
                      <td>{money(day.opening_cash_centavos)}</td>
                      <td>
                        {day.closing
                          ? varianceText(day.closing.variance_centavos)
                          : 'Awaiting count'}
                      </td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => onSelect(day.id)}>
                          View {day.business_date}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 pb-5 text-sm text-stone-500">No cash days have been opened yet.</p>
          )}
          <div className="px-5 pb-5">
            <Pagination meta={result.data.meta} onPage={setPage} />
          </div>
        </>
      )}
    </section>
  )
}
