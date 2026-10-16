import { ArrowUpRight, Banknote, CreditCard } from 'lucide-react'
import { Badge } from '../../components/ui'
import { money } from '../../lib/format'
import { saleDateTime } from '../../sales/format'
import type { SaleSummary } from '../../sales/types'

export default function SalesTable({
  sales,
  onSelect,
}: {
  sales: SaleSummary[]
  onSelect: (id: number) => void
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Sold by</th>
            <th>Quantity</th>
            <th>Payment</th>
            <th>Status</th>
            <th className="text-right">Total</th>
            <th>
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>
                <button
                  className="whitespace-nowrap font-semibold text-forest hover:underline"
                  onClick={() => onSelect(sale.id)}
                >
                  {sale.sale_number}
                </button>
                <span className="mt-1 block whitespace-nowrap text-[10px] text-stone-500">
                  {saleDateTime.format(new Date(sale.completed_at))}
                </span>
              </td>
              <td>{sale.sold_by.name}</td>
              <td>
                {sale.quantity_total} units · {sale.items_count} products
              </td>
              <td>
                <span className="inline-flex items-center gap-1.5">
                  {sale.payment_method === 'credit' ? (
                    <>
                      <CreditCard size={14} /> Utang
                    </>
                  ) : (
                    <>
                      <Banknote size={14} /> Cash
                    </>
                  )}
                </span>
                {sale.customer && (
                  <span className="mt-1 block text-[10px] text-stone-500">
                    {sale.customer.name}
                  </span>
                )}
              </td>
              <td>
                <Badge tone={sale.status === 'completed' ? 'green' : 'orange'}>
                  {sale.status === 'completed'
                    ? 'Completed'
                    : sale.status === 'voided'
                      ? 'Voided'
                      : 'Refunded'}
                </Badge>
              </td>
              <td className="text-right font-semibold tabular-nums">
                {money(sale.total_centavos)}
              </td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`View ${sale.sale_number}`}
                  onClick={() => onSelect(sale.id)}
                >
                  <ArrowUpRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
