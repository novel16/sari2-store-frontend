import { Banknote } from 'lucide-react'
import { money } from '../../../lib/format'
import type { ReportTotals } from '../../../reports/types'

export default function CollectionsSummary({ summary: s }: { summary: ReportTotals }) {
  return (
    <section className="panel mb-6 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Banknote size={18} className="text-forest" />
        Cash collected in this period
      </h2>
      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          ['From cash sales', s.cash_sales_centavos],
          ['From utang repayments', s.repayments_centavos],
          ['Total cash collected', s.cash_collected_centavos],
        ].map(([label, amount]) => (
          <div key={label} className="min-w-0 rounded-lg bg-paper/70 p-3">
            <dt className="mb-1.5 text-[11px] text-stone-500">{label}</dt>
            <dd className="text-xl font-bold text-forest [overflow-wrap:anywhere]">
              {money(amount)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
        Cash sales exclude change. {s.repayment_count.toLocaleString('en-PH')} cash{' '}
        {s.repayment_count === 1 ? 'repayment was' : 'repayments were'} recorded in this period,
        including payments for older utang. Repayments do not add another sale.
      </p>
    </section>
  )
}
