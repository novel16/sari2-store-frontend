import { Archive, ArchiveRestore, Pencil } from 'lucide-react'
import { Badge } from '../../components/ui'
import { stockLabel, stockTone } from '../../catalog/constants'
import type { Product } from '../../catalog/types'
import { money } from '../../lib/format'

export default function ProductCard({
  product,
  onEdit,
  onStatus,
}: {
  product: Product
  onEdit: () => void
  onStatus: () => void
}) {
  const quantity = product.inventory.quantity_on_hand
  return (
    <article className="panel group overflow-hidden transition hover:border-forest/20 hover:shadow-md hover:shadow-forest/5">
      <div
        className="relative flex h-37 items-center justify-center"
        style={{ background: product.color }}
      >
        <span
          className="text-6xl drop-shadow-sm transition duration-300 group-hover:scale-110"
          aria-hidden="true"
        >
          {product.emoji}
        </span>
        <div className="absolute right-3 top-3 flex gap-1">
          <button
            className="icon-button bg-white/80"
            aria-label={`Edit ${product.name}`}
            onClick={onEdit}
          >
            <Pencil size={14} />
          </button>
          <button
            className="icon-button bg-white/80"
            aria-label={`${product.status === 'archived' ? 'Restore' : 'Archive'} ${product.name}`}
            onClick={onStatus}
          >
            {product.status === 'archived' ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </button>
        </div>
        <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-md bg-white/80 px-2 py-1 text-[9px] font-medium text-stone-500">
          {product.category?.name ?? 'Uncategorized'}
        </span>
      </div>
      <div className="p-4">
        <h2 className="min-h-8 break-words font-display text-[12px] font-bold leading-relaxed">
          {product.name}
        </h2>
        <p className="mt-0.5 truncate text-[10px] text-stone-500">
          {product.description || product.sku || `Sold per ${product.unit}`}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <strong className="text-lg font-bold tracking-tight text-forest">
              {money(product.price_centavos)}
            </strong>
            <span className="ml-1 text-[9px] text-stone-500">/ {product.unit}</span>
          </div>
          <Badge
            tone={
              product.status === 'archived'
                ? 'neutral'
                : stockTone(quantity, product.low_stock_threshold)
            }
          >
            {product.status === 'archived'
              ? 'Archived'
              : stockLabel(quantity, product.low_stock_threshold) === 'In stock'
                ? `${quantity} in stock`
                : stockLabel(quantity, product.low_stock_threshold)}
          </Badge>
        </div>
      </div>
    </article>
  )
}
