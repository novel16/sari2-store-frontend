import { CircleDollarSign, Package, ReceiptText, ShoppingBag, Tag, TrendingUp } from 'lucide-react'
import { StatCard } from '../../../components/ui'
import { money } from '../../../lib/format'
import { averageSale } from '../../../reports/money'
import type { ReportTotals } from '../../../reports/types'

export default function ReportStats({ summary: s }: { summary: ReportTotals }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 xl:grid-cols-3 [&_.stat-value]:[overflow-wrap:anywhere]">
      <StatCard
        label="Gross sales"
        value={money(s.gross_sales_centavos)}
        icon={<CircleDollarSign size={19} />}
        note="Before order discounts"
      />
      <StatCard
        label="Discounts"
        value={money(s.discounts_centavos)}
        icon={<Tag size={19} />}
        note="Applied at checkout"
      />
      <StatCard
        className="stat-featured"
        label="Sales after discounts"
        value={money(s.net_sales_centavos)}
        icon={<ReceiptText size={19} />}
        note="Cash + utang sales"
      />
      <StatCard
        label="Transactions"
        value={s.transactions.toLocaleString('en-PH')}
        icon={<ShoppingBag size={19} />}
        note="Checkouts recorded before reversals"
      />
      <StatCard
        label="Units sold"
        value={BigInt(s.units_sold).toLocaleString('en-PH')}
        icon={<Package size={19} />}
        note="Saved quantities before returns"
      />
      <StatCard
        label="Average sale"
        value={money(averageSale(s.net_sales_centavos, s.transactions))}
        icon={<TrendingUp size={19} />}
        note="Sales after discounts ÷ transactions"
      />
    </div>
  )
}
