import { Package, ShoppingBasket, Users, Wallet } from 'lucide-react'
import { StatCard } from '../../../components/ui'
import type { DashboardData } from '../../../dashboard/types'
import { money } from '../../../lib/format'

export default function DashboardStats({ data }: { data: DashboardData }) {
  return (
    <div className="stats-grid mb-6 [&_.stat-value]:[overflow-wrap:anywhere]">
      <StatCard
        className="stat-featured"
        label="Today's sales"
        value={money(data.today.net_after_reversals_centavos)}
        icon={<Wallet size={19} />}
        note="After discounts and reversals recorded today"
      />
      <StatCard
        label="Today's transactions"
        value={data.today.transactions.toLocaleString('en-PH')}
        icon={<ShoppingBasket size={19} />}
        note="Checkouts recorded today, before reversals"
      />
      <StatCard
        label="Needs a refill"
        value={(data.stock.low_stock + data.stock.out_of_stock).toLocaleString('en-PH')}
        icon={<Package size={19} />}
        note="Low-stock and out-of-stock products"
      />
      <StatCard
        label="Outstanding utang"
        value={money(data.credit.outstanding_centavos)}
        icon={<Users size={19} />}
        note={`${data.credit.customers_with_balance.toLocaleString('en-PH')} ${data.credit.customers_with_balance === 1 ? 'customer' : 'customers'} with unpaid utang${data.credit.archived_with_balance ? ', including archived customers' : ''}`}
      />
    </div>
  )
}
