import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge, EmptyState } from '../../../components/ui'
import { money } from '../../../lib/format'
import { saleDateTime } from '../../../sales/format'
import type { SaleSummary } from '../../../sales/types'

export default function RecentTransactions({ sales }: { sales: SaleSummary[] }) {
  return (
    <section className="panel min-w-0 overflow-hidden">
      <div className="panel-heading">
        <div>
          <h2>Recent transactions</h2>
          <p className="mt-1 text-[10px] text-stone-500">Your latest saved sales</p>
        </div>
        <Link to="/sales" className="section-link">
          View all <ArrowRight size={13} />
        </Link>
      </div>
      {sales.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <Link
                      to={`/sales?sale_id=${sale.id}`}
                      className="whitespace-nowrap font-semibold text-forest hover:underline"
                    >
                      {sale.sale_number}
                    </Link>
                    <span className="mt-1 block whitespace-nowrap text-[10px] text-stone-500">
                      {saleDateTime.format(new Date(sale.completed_at))}
                    </span>
                  </td>
                  <td>
                    <span className="block max-w-40 break-words">
                      {sale.customer?.name ?? 'Walk-in customer'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap font-semibold">{money(sale.total_centavos)}</td>
                  <td>
                    <Badge tone={sale.payment_method === 'credit' ? 'orange' : 'green'}>
                      {sale.payment_method === 'credit' ? 'Utang' : 'Cash'}
                    </Badge>
                    {sale.status !== 'completed' && (
                      <span className="mt-1 block text-[10px] font-semibold text-amber-800">
                        {sale.status === 'voided' ? 'Voided' : 'Refunded'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No sales yet"
          description="Your completed checkouts will appear here."
          action={
            <Link to="/pos" className="btn btn-primary">
              Start a sale
            </Link>
          }
        />
      )}
    </section>
  )
}
