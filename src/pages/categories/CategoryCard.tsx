import { Archive, ArchiveRestore, ArrowUpRight, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui'
import type { Category } from '../../catalog/types'

export default function CategoryCard({
  category,
  onEdit,
  onStatus,
}: {
  category: Category
  onEdit: () => void
  onStatus: () => void
}) {
  return (
    <article className="panel p-5">
      <div className="mb-5 flex items-start justify-between">
        <span
          className="flex size-14 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: category.color }}
        >
          {category.emoji}
        </span>
        <div className="flex gap-1">
          <button className="icon-button" aria-label={`Edit ${category.name}`} onClick={onEdit}>
            <Pencil size={15} />
          </button>
          <button
            className="icon-button"
            aria-label={`${category.status === 'active' ? 'Archive' : 'Restore'} ${category.name}`}
            onClick={onStatus}
          >
            {category.status === 'active' ? <Archive size={15} /> : <ArchiveRestore size={15} />}
          </button>
        </div>
      </div>
      <h2 className="break-words font-display text-sm font-bold">{category.name}</h2>
      <p className="mt-2 min-h-8 text-[11px] leading-relaxed text-stone-500">
        {category.description || 'A home for your everyday essentials.'}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4">
        <Badge tone="neutral">{category.products_count} products, incl. archives</Badge>
        <Link
          to={`/products?category_id=${category.id}${category.status === 'archived' ? '&view=archived' : ''}`}
          className="section-link"
        >
          View products
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  )
}
