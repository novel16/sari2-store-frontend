import { Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../../components/ui'
import { dashboardDate, dashboardPeriods } from '../../../dashboard/format'
import type { DashboardData } from '../../../dashboard/types'

export default function TopProducts({
  products,
  chart,
}: {
  products: DashboardData['top_products']
  chart: DashboardData['chart']
}) {
  return (
    <section className="panel min-w-0">
      <div className="panel-heading flex-wrap gap-2">
        <div>
          <h2>Top-selling products</h2>
          <p className="mt-1 text-[10px] text-stone-500">
            {dashboardPeriods[chart.period]} · {dashboardDate(chart.date_from)} –{' '}
            {dashboardDate(chart.date_to)}
          </p>
        </div>
        <span className="text-[10px] text-stone-500">Units sold before returns</span>
      </div>
      {products.length ? (
        <ol className="grid gap-4 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <li key={product.product_id}>
              <Link
                to="/products"
                className="flex items-center gap-3 rounded-lg bg-paper/70 p-3 hover:bg-forest/5"
              >
                <span className="text-xs font-bold text-stone-400">{index + 1}</span>
                <Package size={20} className="shrink-0 text-forest/60" />
                <span className="min-w-0">
                  <strong className="block break-words text-xs">{product.name}</strong>
                  <span className="text-[10px] text-stone-500">
                    {BigInt(product.units_sold).toLocaleString('en-PH')} {product.unit} sold
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          title="No top products yet"
          description="Products from completed sales in this period will appear here."
        />
      )}
    </section>
  )
}
