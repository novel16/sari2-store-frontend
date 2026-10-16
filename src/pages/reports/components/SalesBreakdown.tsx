import { money } from '../../../lib/format'
import { reportPercent } from '../../../reports/money'
import type { ReportTotals } from '../../../reports/types'

export default function SalesBreakdown({ summary: s }: { summary: ReportTotals }) {
  const cash = reportPercent(s.cash_sales_centavos, s.net_sales_centavos)
  const hasSales = BigInt(s.net_sales_centavos) > 0n
  return (
    <section className="panel min-w-0">
      <div className="panel-heading">
        <div>
          <h2>Sales by payment</h2>
          <p className="mt-1 text-[11px] text-stone-500">Sales after discounts</p>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div
          className="mx-auto my-5 size-36 rounded-full p-4"
          style={{
            background: hasSales
              ? `conic-gradient(#315c46 0% ${cash}%, #e4ae61 ${cash}% 100%)`
              : '#e9ece5',
          }}
          role="img"
          aria-label={`Cash sales ${money(s.cash_sales_centavos)}, utang sales ${money(s.credit_sales_centavos)}`}
        >
          <div className="flex size-full items-center justify-center rounded-full bg-white text-xs font-semibold text-stone-500">
            {hasSales ? `${cash.toFixed(2)}% cash` : 'No sales amount'}
          </div>
        </div>
        <dl className="space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-forest" />
              Cash sales
            </dt>
            <dd className="font-semibold">{money(s.cash_sales_centavos)}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#e4ae61]" />
              Utang sales
            </dt>
            <dd className="font-semibold">{money(s.credit_sales_centavos)}</dd>
          </div>
        </dl>
        <p className="mt-5 border-t border-stone-100 pt-4 text-[11px] leading-relaxed text-stone-500">
          Utang sales are included in sales revenue. Cash from repayments appears separately under
          collections.
        </p>
      </div>
    </section>
  )
}
