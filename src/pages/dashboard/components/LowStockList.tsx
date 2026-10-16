import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ProductArt } from '../../../components/ui'
import type { DashboardData } from '../../../dashboard/types'

export default function LowStockList({ stock }: { stock: DashboardData['stock'] }) {
  const total = stock.low_stock + stock.out_of_stock
  return (
    <section className="panel min-w-0">
      <div className="panel-heading">
        <div>
          <h2>Running a little low</h2>
          <p className="mt-1 text-[10px] text-stone-500">Out-of-stock products appear first</p>
        </div>
        <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">
          {total.toLocaleString('en-PH')}
        </span>
      </div>
      <div className="px-5">
        {stock.alerts.map((product) => (
          <Link
            to="/inventory"
            key={product.id}
            className="flex items-center gap-3 border-b border-stone-100 py-3 last:border-0"
          >
            <ProductArt product={product} small />
            <span className="min-w-0 flex-1">
              <strong className="block break-words text-[11px] font-semibold">
                {product.name}
              </strong>
              <span className="text-[10px] text-stone-500">
                Alert at {product.low_stock_threshold} {product.unit}
              </span>
            </span>
            <span
              className={`shrink-0 text-[10px] font-semibold ${product.quantity_on_hand === 0 ? 'text-red-600' : 'text-amber-700'}`}
            >
              {product.quantity_on_hand === 0
                ? 'Out of stock'
                : `${product.quantity_on_hand.toLocaleString('en-PH')} left`}
            </span>
          </Link>
        ))}
        {!total && (
          <p className="py-7 text-xs leading-relaxed text-stone-500">
            {stock.active_products
              ? 'All active products are above their low-stock thresholds.'
              : 'Stock alerts will appear after you add products.'}
          </p>
        )}
        {total > stock.alerts.length && (
          <p className="pt-3 text-[10px] text-stone-500">
            Showing {stock.alerts.length} of {total} products needing a refill.
          </p>
        )}
      </div>
      <Link
        to="/inventory"
        className="section-link mx-5 my-4 justify-center rounded-lg border border-stone-200 py-3"
      >
        Manage inventory <ArrowRight size={13} />
      </Link>
    </section>
  )
}
