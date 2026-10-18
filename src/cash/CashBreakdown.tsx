import { money } from '../lib/format'
import { totalRows } from './format'
import type { CashTotals } from './types'

export default function CashBreakdown({ totals }: { totals: CashTotals }) {
  return (
    <dl className="space-y-3">
      {totalRows.map(([key, label]) => (
        <div
          key={key}
          className={
            key === 'expected_cash_centavos'
              ? 'flex justify-between gap-4 border-t border-stone-200 pt-4 text-base font-bold'
              : 'flex justify-between gap-4 text-sm'
          }
        >
          <dt className="text-stone-500">{label}</dt>
          <dd className="text-right font-semibold tabular-nums">
            {['cash_refunds_centavos', 'cash_out_centavos'].includes(key) ? '- ' : ''}
            {money(String(totals[key]))}
          </dd>
        </div>
      ))}
      <div className="border-t border-stone-100 pt-3 text-[11px] leading-relaxed text-stone-500">
        {totals.cash_sale_count} cash sale(s) - {totals.repayment_count} cash utang payment(s) -{' '}
        {totals.cash_refund_count} cash refund(s) - {totals.movement_count} manual movement(s)
      </div>
    </dl>
  )
}
