import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import type { DashboardData } from '../../../dashboard/types'

export default function StockOverview({ stock }: { stock: DashboardData['stock'] }) {
  const inStock = stock.active_products ? (stock.in_stock / stock.active_products) * 100 : 0
  const available = stock.active_products
    ? ((stock.in_stock + stock.low_stock) / stock.active_products) * 100
    : 0
  return (
    <section className="panel min-w-0">
      <div className="panel-heading">
        <div>
          <h2>On your shelves</h2>
          <p className="mt-1 text-[10px] text-stone-500">Current active products</p>
        </div>
        <ShoppingBag size={18} className="text-stone-400" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5 px-5 py-5">
        <div
          className="relative size-[130px] shrink-0 rounded-full p-[13px]"
          style={{
            background: `conic-gradient(#315c46 0% ${inStock}%, #e4ae61 ${inStock}% ${available}%, #e9ece5 ${available}% 100%)`,
          }}
          role="img"
          aria-label={`${stock.in_stock} in stock, ${stock.low_stock} low stock, ${stock.out_of_stock} out of stock`}
        >
          <div className="flex size-full flex-col items-center justify-center rounded-full bg-white">
            <strong className="font-display text-2xl font-bold">
              {stock.active_products.toLocaleString('en-PH')}
            </strong>
            <span className="text-[9px] text-stone-500">active products</span>
          </div>
        </div>
        <dl className="space-y-3">
          {[
            { label: 'In stock', color: '#315c46', value: stock.in_stock },
            { label: 'Low stock', color: '#e4ae61', value: stock.low_stock },
            { label: 'Out of stock', color: '#e1e5db', value: stock.out_of_stock },
          ].map((item) => (
            <div className="flex items-center gap-2 text-[11px]" key={item.label}>
              <span className="size-2 rounded-full" style={{ background: item.color }} />
              <dt className="text-stone-500">{item.label}</dt>
              <dd className="ml-auto font-semibold">{item.value.toLocaleString('en-PH')}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="px-5 text-[11px] text-stone-500">
        {stock.active_products
          ? 'Low stock includes products at their alert threshold. Archived products are excluded.'
          : 'Add your first product to start tracking your shelves.'}
      </p>
      <Link
        to={stock.active_products ? '/inventory' : '/products'}
        className="section-link mx-5 my-5 justify-center rounded-lg border border-stone-200 py-3"
      >
        {stock.active_products ? 'Manage inventory' : 'Add products'}
      </Link>
    </section>
  )
}
