import { useState } from 'react'
import FormError from '../auth/components/FormError'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { QueryState } from '../components/ui/QueryState'
import { useStoreQuery } from '../hooks/useStoreQuery'
import { cashPath } from './api'
import CashRecovery from './CashRecovery'
import CashDayDetails from './CashDayDetails'
import CashDayHistory from './CashDayHistory'
import CashMovements from './CashMovements'
import CashMovementDialog from './CashMovementDialog'
import CashCloseDialog from './CashCloseDialog'
import OpenCashDay from './OpenCashDay'
import { useCashOperation } from './useCashOperation'
import type { CashDay, CashDayResult, CashResult, CurrentCashDay } from './types'

export default function CashClosingWorkspace({
  userId,
  storeId,
}: {
  userId: number
  storeId: number
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [movement, setMovement] = useState<CashDay | null>(null)
  const [closing, setClosing] = useState<CashDayResult | null>(null)
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  const current = useStoreQuery<CurrentCashDay>(cashPath(storeId) + '/current')
  const detail = useStoreQuery<CashDayResult>(selected ? cashPath(storeId) + '/' + selected : null)
  const businessDate = current.data?.business_date
  const today = current.data?.data
  const displayed = selected
    ? detail.data
    : today && current.data?.totals
      ? { data: today, totals: current.data.totals }
      : undefined
  function changed(result?: CashResult) {
    current.reload()
    detail.reload()
    setRevision((value) => value + 1)
    if (result) {
      const day = 'day' in result ? result.day : result.data
      setNotice(
        day.status === 'closed'
          ? 'Final cash closing saved for ' + day.business_date + '.'
          : 'Cash change saved for ' + day.business_date + '.',
      )
      setMovement(null)
      setClosing(null)
    }
  }
  const operation = useCashOperation(userId, storeId, changed)
  const locked = operation.pending || Boolean(operation.attempt) || operation.blocked
  function refresh() {
    current.reload()
    detail.reload()
    setRevision((value) => value + 1)
  }
  return (
    <>
      <PageHeader
        eyebrow="EVERY PESO IN YOUR DRAWER"
        title="Cash closing"
        description="Track opening cash, cash activity, and one final drawer count for each business day."
        actions={
          <button className="btn btn-secondary" onClick={refresh} disabled={operation.pending}>
            <RefreshCw size={15} /> Refresh cash
          </button>
        }
      />
      {businessDate && (
        <p className="my-5 text-sm text-stone-500">
          Today: <strong>{businessDate}</strong> - Philippine time ({current.data?.time_zone})
        </p>
      )}
      <CashRecovery operation={operation} />
      {!operation.attempt && !operation.blocked && !movement && !closing && today && (
        <FormError error={operation.error} />
      )}
      {notice && (
        <p role="status" className="my-5 rounded-xl bg-forest/5 p-4 text-sm text-forest">
          {notice}
        </p>
      )}
      <QueryState loading={current.isLoading} error={current.error} retry={current.reload} />
      {today?.status === 'closed' && (
        <p
          role="status"
          className="my-5 rounded-xl bg-amber-50 p-5 text-sm leading-relaxed text-amber-900"
        >
          Today's cash closing is final. Cash sales, cash utang payments and cash refunds are
          blocked until the next business day. Utang-only sales remain available. A closing cannot
          be reopened.
        </p>
      )}
      {selected && (
        <div className="my-5">
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>
            Return to today
          </button>
          <QueryState loading={detail.isLoading} error={detail.error} retry={detail.reload} />
        </div>
      )}
      {businessDate && !selected && current.data && !today && (
        <OpenCashDay key={businessDate} businessDate={businessDate} operation={operation} />
      )}
      {businessDate && displayed && (
        <>
          <CashDayDetails
            result={displayed}
            businessDate={businessDate}
            locked={locked || Boolean(movement) || Boolean(closing)}
            onMovement={() => {
              operation.clearError()
              setMovement(displayed.data)
            }}
            onCloseDay={() => {
              operation.clearError()
              setClosing(displayed)
            }}
          />
          <CashMovements
            key={'movements:' + displayed.data.id + ':' + revision}
            storeId={storeId}
            dayId={displayed.data.id}
          />
        </>
      )}
      <CashDayHistory key={'history:' + revision} storeId={storeId} onSelect={setSelected} />
      {movement && (
        <CashMovementDialog
          day={movement}
          operation={operation}
          onClose={() => setMovement(null)}
        />
      )}
      {closing && (
        <CashCloseDialog day={closing} operation={operation} onClose={() => setClosing(null)} />
      )}
    </>
  )
}
