import { Download } from 'lucide-react'
import { money } from '../lib/format'
import { cashDateTime, exportCashClosing, varianceText } from './format'
import CashBreakdown from './CashBreakdown'
import type { CashDayResult } from './types'

export default function CashDayDetails({
  result,
  businessDate,
  locked,
  onMovement,
  onCloseDay,
}: {
  result: CashDayResult
  businessDate: string
  locked: boolean
  onMovement: () => void
  onCloseDay: () => void
}) {
  const { data: day } = result
  const totals = day.closing?.totals ?? result.totals
  const today = day.business_date === businessDate
  return (
    <section className="panel p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            {day.business_date} - {day.status === 'closed' ? 'Final closing' : 'Open cash day'}
          </h2>
          <p className="mt-2 text-xs text-stone-500">
            Opened by {day.opened_by.name} - {cashDateTime(day.opened_at)}
          </p>
        </div>
        {day.status === 'closed' && (
          <button className="btn btn-secondary" onClick={() => exportCashClosing(day, totals)}>
            <Download size={15} /> Download closing CSV
          </button>
        )}
      </div>
      {day.notes && (
        <p className="mb-5 whitespace-pre-wrap break-words text-sm text-stone-500">{day.notes}</p>
      )}
      <CashBreakdown totals={totals} />
      {day.closing ? (
        <>
          <dl className="my-5 grid gap-5 rounded-xl bg-paper p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-stone-500">Counted cash</dt>
              <dd className="mt-2 text-xl font-bold">{money(day.closing.counted_cash_centavos)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Final difference</dt>
              <dd className="mt-2 text-xl font-bold">
                {varianceText(day.closing.variance_centavos)}
              </dd>
            </div>
          </dl>
          {day.closing.notes && (
            <p className="mb-4 whitespace-pre-wrap break-words text-sm">{day.closing.notes}</p>
          )}
          <p className="text-xs text-stone-500">
            Closed by {day.closed_by?.name} - {day.closed_at ? cashDateTime(day.closed_at) : ''}.
            This closing cannot be reopened.
          </p>
        </>
      ) : (
        <>
          {!today && (
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
              This earlier cash day is still open. You can review and close it now; new manual
              movements are only available for today.
            </p>
          )}
          <div className="form-actions">
            <button className="btn btn-secondary" disabled={locked || !today} onClick={onMovement}>
              Record cash in / out
            </button>
            <button className="btn btn-primary" disabled={locked} onClick={onCloseDay}>
              Count & close day
            </button>
          </div>
        </>
      )}
    </section>
  )
}
