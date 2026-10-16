import { Banknote } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardData } from '../../../dashboard/types'
import { money } from '../../../lib/format'

export default function CashCollections({ today }: { today: DashboardData['today'] }) {
  return (
    <section className="panel mb-6 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Banknote size={18} className="text-forest" />
        <h2 className="text-sm font-semibold">Cash collected today</h2>
      </div>
      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'From cash sales', amount: today.cash_sales_centavos, to: '/sales' },
          { label: 'From utang repayments', amount: today.repayments_centavos, to: '/customers' },
          { label: 'Total cash collected', amount: today.cash_collected_centavos },
        ].map(({ label, amount, to }) => (
          <div key={label} className="min-w-0 rounded-lg bg-paper/70 p-3">
            <dt className="mb-1.5 text-[11px] text-stone-500">
              {to ? (
                <Link className="hover:text-forest hover:underline" to={to}>
                  {label}
                </Link>
              ) : (
                label
              )}
            </dt>
            <dd className="text-xl font-bold text-forest [overflow-wrap:anywhere]">
              {money(amount)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs">
        <span>
          Cash refunds: <strong>{money(today.cash_refunds_centavos)}</strong>
        </span>
        <span>
          Net cash collected: <strong>{money(today.net_cash_collected_centavos)}</strong>
        </span>
        <span>{today.reversal_count} voids / refunds</span>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
        Cash sales exclude change. Repayments are collections of existing utang and do not add
        another sale. Today's new utang sales:{' '}
        <strong className="text-ink">{money(today.credit_sales_centavos)}</strong>.
      </p>
    </section>
  )
}
