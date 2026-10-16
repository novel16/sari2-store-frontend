import { money } from '../../../lib/format'
import type { ReportTotals } from '../../../reports/types'

export default function ReversalSummary({ summary: s }: { summary: ReportTotals }) {
  return (
    <section className="panel mb-6 border-amber-200 p-5">
      <h2 className="mb-4 text-sm font-semibold">Voids, refunds & net totals</h2>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Sales reversed', s.reversed_sales_centavos],
          ['Cash refunds', s.cash_refunds_centavos],
          ['Net sales after reversals', s.net_after_reversals_centavos],
          ['Net cash collected', s.net_cash_collected_centavos],
        ].map(([label, amount]) => (
          <div key={label} className="min-w-0 rounded-lg bg-paper p-3">
            <dt className="mb-2 text-[11px] text-stone-500">{label}</dt>
            <dd className="text-xl font-bold text-forest [overflow-wrap:anywhere]">
              {money(amount)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-stone-500">
        {s.reversal_count} full-sale reversals recorded in this period. Offsets use the reversal
        date; original sales remain on their checkout date. Net totals can be negative when
        returning older sales.
      </p>
    </section>
  )
}
