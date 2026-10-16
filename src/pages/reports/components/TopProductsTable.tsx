import { EmptyState } from '../../../components/ui'
import { money } from '../../../lib/format'
import type { SalesReport } from '../../../reports/types'

export default function TopProductsTable({
  products,
  limit,
}: {
  products: SalesReport['top_products']
  limit: number
}) {
  return (
    <section className="panel mb-6 min-w-0 overflow-hidden">
      <div className="panel-heading flex-wrap gap-3">
        <div>
          <h2>Top-selling products</h2>
          <p className="mt-1 text-[11px] text-stone-500">
            Top {limit} by units sold before returns in the applied date range
          </p>
        </div>
        <span className="text-[10px] text-stone-500">Saved sale prices and names</span>
      </div>
      {products.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Units sold</th>
                <th className="text-right">Sales before order discounts</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.product_id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong className="block max-w-72 break-words">{product.name}</strong>
                    <span className="mt-1 block text-[10px] text-stone-500">{product.unit}</span>
                  </td>
                  <td>{BigInt(product.units_sold).toLocaleString('en-PH')}</td>
                  <td className="text-right font-semibold">
                    {money(product.gross_sales_centavos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No products sold in this period"
          description="Products from completed cash and utang sales will appear here."
        />
      )}
      <p className="border-t border-stone-100 p-5 text-[11px] leading-relaxed text-stone-500">
        Order discounts are shown in the sales summary and are not allocated to individual products.
        Product amounts are sales before those discounts.
      </p>
    </section>
  )
}
