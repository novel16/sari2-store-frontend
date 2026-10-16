import { Modal } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { storePath } from '../../catalog/api'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import SaleSummary from '../../sales/SaleSummary'
import SummaryActions from '../../sales/SummaryActions'
import type { SaleDetail } from '../../sales/types'

export default function SaleDetailsDialog({
  storeId,
  saleId,
  onClose,
  onReverse,
  reversalLocked = false,
}: {
  storeId: number
  saleId: number
  onClose: () => void
  onReverse?: () => void
  reversalLocked?: boolean
}) {
  const result = useStoreQuery<{ data: SaleDetail }>(`${storePath(storeId)}/sales/${saleId}`)
  return (
    <Modal title="Sale details" onClose={onClose}>
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          <SaleSummary sale={result.data.data} />
          <SummaryActions sale={result.data.data} />
          {onReverse && result.data.data.status === 'completed' && (
            <div className="form-actions">
              <button className="btn btn-secondary" disabled={reversalLocked} onClick={onReverse}>
                Void / refund sale
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
