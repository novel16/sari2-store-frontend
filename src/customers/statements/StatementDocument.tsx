import { money } from '../../lib/format'
import { saleDateTime } from '../../sales/format'
import { decreasesBalance, entryLabel, entryReference } from './format'
import type { CustomerStatement } from './types'

export default function StatementDocument({ statement }: { statement: CustomerStatement }) {
  return (
    <article className="min-w-0 text-sm">
      <div className="mb-6 space-y-1 border-b border-stone-200 pb-5">
        <h1 className="font-display text-2xl font-bold">{statement.store.name}</h1>
        {statement.store.address && (
          <p className="text-xs text-stone-500">{statement.store.address}</p>
        )}
        {statement.store.phone && <p className="text-xs text-stone-500">{statement.store.phone}</p>}
      </div>
      <h2 className="text-lg font-semibold">Customer utang statement</h2>
      <p className="mt-3 break-words font-semibold">{statement.customer.name}</p>
      {statement.customer.phone && (
        <p className="text-xs text-stone-500">{statement.customer.phone}</p>
      )}
      <p className="my-3 text-xs text-stone-500">
        Generated {saleDateTime.format(new Date(statement.generated_at))} · Through entry #
        {statement.snapshot_id}
      </p>
      <dl className="my-5 grid grid-cols-1 gap-3 rounded-xl bg-paper p-4 text-xs sm:grid-cols-2">
        <div>
          Opening utang{' '}
          <strong className="float-right">{money(statement.totals.opening_centavos)}</strong>
        </div>
        <div>
          Utang sales{' '}
          <strong className="float-right">{money(statement.totals.charges_centavos)}</strong>
        </div>
        <div>
          Cash repayments{' '}
          <strong className="float-right">{money(statement.totals.payments_centavos)}</strong>
        </div>
        <div>
          Debt reversed{' '}
          <strong className="float-right">{money(statement.totals.reversals_centavos)}</strong>
        </div>
      </dl>
      <ol className="divide-y divide-stone-200">
        {statement.data.map((entry) => (
          <li key={entry.id} className="break-inside-avoid space-y-2 py-4 text-xs">
            <div className="flex flex-wrap justify-between gap-2 font-semibold">
              <span>
                {entryLabel(entry)} · {entryReference(entry)}
              </span>
              <span className={decreasesBalance(entry) ? 'text-forest' : 'text-amber-900'}>
                {decreasesBalance(entry) ? '−' : '+'}
                {money(entry.amount_centavos)}
              </span>
            </div>
            <p className="text-stone-500">
              {saleDateTime.format(new Date(entry.created_at))} · {entry.recorded_by.name}
            </p>
            {entry.notes && (
              <p className="whitespace-pre-wrap break-words text-stone-600">{entry.notes}</p>
            )}
            <p className="text-right">
              Balance after: <strong>{money(entry.balance_after_centavos)}</strong>
            </p>
          </li>
        ))}
      </ol>
      {!statement.data.length && (
        <p className="my-8 text-center text-stone-500">No financial transactions yet.</p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-300 pt-5 font-semibold">
        <span>Outstanding utang</span>
        <strong className="text-2xl text-forest">
          {money(statement.customer.balance_centavos)}
        </strong>
      </div>
    </article>
  )
}
