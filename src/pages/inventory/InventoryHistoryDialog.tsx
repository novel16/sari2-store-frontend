import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../../components/ui'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import { storePath } from '../../catalog/api'
import type { Movement, PageResponse, Product } from '../../catalog/types'
import { useStoreQuery } from '../../hooks/useStoreQuery'

const labels = {
  opening: 'Opening stock',
  stock_in: 'Stock in',
  stock_out: 'Stock out',
  adjustment: 'Count correction',
  sale: 'Sale',
  sale_return: 'Sale return',
}
const timestamp = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Manila',
})

export default function InventoryHistoryDialog({
  storeId,
  product,
  onClose,
}: {
  storeId: number
  product: Product | null
  onClose: () => void
}) {
  const [page, setPage] = useState(1)
  const query = new URLSearchParams({ page: String(page), per_page: '20' })
  if (product) query.set('product_id', String(product.id))
  const result = useStoreQuery<PageResponse<Movement>>(
    `${storePath(storeId)}/inventory/movements?${query}`,
  )
  return (
    <Modal
      title={product ? `${product.name} · Stock history` : 'Stock movement history'}
      onClose={onClose}
      wide
    >
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          <ol className="space-y-3">
            {result.data.data.map((movement) => (
              <li key={movement.id} className="rounded-xl border border-stone-200 p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <strong className="text-xs">{movement.product.name}</strong>
                    <p className="mt-1 text-[11px] text-stone-500">
                      {labels[movement.movement_type]} · {movement.quantity_before} →{' '}
                      {movement.quantity_after} {movement.product.unit}(s)
                    </p>
                  </div>
                  <strong className={movement.quantity_delta < 0 ? 'text-red-700' : 'text-forest'}>
                    {movement.quantity_delta > 0 ? '+' : ''}
                    {movement.quantity_delta}
                  </strong>
                </div>
                <p className="mt-3 break-words text-xs text-stone-600">{movement.reason}</p>
                {(movement.sale_id || movement.reversal_sale_id) && (
                  <Link
                    to={`/sales?sale_id=${movement.sale_id ?? movement.reversal_sale_id}`}
                    onClick={onClose}
                    className="mt-2 inline-block text-xs font-semibold text-forest underline"
                  >
                    {movement.reversal_reference ?? 'View sale'}
                  </Link>
                )}
                <p className="mt-2 text-[10px] text-stone-500">
                  {movement.actor.name} · {timestamp.format(new Date(movement.created_at))}
                </p>
              </li>
            ))}
          </ol>
          {!result.data.data.length && (
            <p className="py-8 text-center text-sm text-stone-500">
              No stock movements recorded yet.
            </p>
          )}
          <Pagination meta={result.data.meta} onPage={setPage} />
        </>
      )}
    </Modal>
  )
}
