import { CheckCheck } from 'lucide-react'
import { Modal } from '../components/ui'
import SaleSummary from './SaleSummary'
import SummaryActions from './SummaryActions'
import type { SaleDetail } from './types'

export default function SaleSummaryDialog({
  sale,
  title,
  onClose,
}: {
  sale: SaleDetail
  title: string
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p role="status" className="mb-4 flex items-center gap-2 text-xs text-forest">
        <CheckCheck size={18} />
        Sale saved. Inventory is updated.
      </p>
      <SaleSummary sale={sale} />
      <SummaryActions sale={sale} />
    </Modal>
  )
}
