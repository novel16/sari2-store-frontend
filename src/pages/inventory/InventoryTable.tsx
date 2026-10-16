import { ArrowDownUp, History } from 'lucide-react'
import { Badge, ProductArt } from '../../components/ui'
import { stockLabel, stockTone } from '../../catalog/constants'
import type { Product } from '../../catalog/types'

export default function InventoryTable({
  products,
  onAdjust,
  onHistory,
}: {
  products: Product[]
  onAdjust: (product: Product) => void
  onHistory: (product: Product) => void
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>On hand</th>
            <th>Reorder level</th>
            <th>Status</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const quantity = product.inventory.quantity_on_hand
            return (
              <tr key={product.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <ProductArt product={product} small />
                    <div>
                      <strong className="block whitespace-nowrap font-semibold">
                        {product.name}
                      </strong>
                      <span className="mt-1 block text-[10px] text-stone-500">
                        {product.sku || product.description}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap text-stone-500">
                  {product.category?.name ?? 'Uncategorized'}
                </td>
                <td>
                  <strong
                    className={
                      quantity <= product.low_stock_threshold ? 'text-[#b4833a]' : 'text-ink'
                    }
                  >
                    {quantity}
                  </strong>
                  <span className="ml-1 text-[10px] text-stone-500">{product.unit}(s)</span>
                </td>
                <td className="text-stone-500">{product.low_stock_threshold}</td>
                <td>
                  <Badge tone={stockTone(quantity, product.low_stock_threshold)}>
                    {stockLabel(quantity, product.low_stock_threshold)}
                  </Badge>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button
                      className="btn btn-ghost whitespace-nowrap"
                      aria-label={`Adjust ${product.name}`}
                      onClick={() => onAdjust(product)}
                    >
                      <ArrowDownUp size={13} />
                      Adjust
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Stock history for ${product.name}`}
                      onClick={() => onHistory(product)}
                    >
                      <History size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
