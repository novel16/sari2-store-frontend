import { Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Modal } from '../ui'
import { QueryState } from '../ui/QueryState'
import { storePath } from '../../catalog/api'
import type { PageResponse, Product } from '../../catalog/types'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useWorkspace } from '../../hooks/useWorkspace'

export default function NotificationsDialog({ onClose }: { onClose: () => void }) {
  const { store } = useWorkspace()
  const navigate = useNavigate()
  const result = useStoreQuery<PageResponse<Product>>(
    store ? `${storePath(store.id)}/inventory?per_page=1` : null,
  )
  const summary = result.data?.meta.summary
  const low = summary ? summary.low_stock + summary.out_of_stock : 0
  return (
    <Modal title="Your store updates" onClose={onClose}>
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {summary && (
        <>
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-xs text-stone-500">Based on your current inventory.</p>
            <Badge tone={low ? 'orange' : 'green'}>{low} need restocking</Badge>
          </div>
          <button
            className="flex w-full gap-3 rounded-xl border border-stone-200 bg-paper p-4 text-left"
            onClick={() => {
              onClose()
              navigate('/inventory')
            }}
          >
            <span className="text-forest">
              <Package size={20} />
            </span>
            <span>
              <strong className="block text-sm">
                {low ? 'Time for a small restock' : 'Your shelves look good'}
              </strong>
              <span className="mt-2 block text-xs leading-relaxed text-stone-500">
                {summary.low_stock} low-stock and {summary.out_of_stock} out-of-stock products. Open
                inventory to review your stock.
              </span>
            </span>
          </button>
        </>
      )}
    </Modal>
  )
}
