import { RefreshCw, SearchCheck } from 'lucide-react'
import FormError from '../../auth/components/FormError'
import type { RepaymentState } from './useRepayment'

export default function RepaymentRecovery({
  repayment,
  onRetry,
}: {
  repayment: RepaymentState
  onRetry: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        This cash payment may already be saved. Check its status or retry the same payment before
        recording another. Retrying keeps the original request and will not collect it twice.
      </p>
      <FormError error={repayment.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={repayment.pending}
          onClick={() => void repayment.check()}
        >
          <SearchCheck size={15} />
          Check saved payment
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={repayment.pending}
          onClick={onRetry}
        >
          <RefreshCw size={15} />
          Retry same payment
        </button>
      </div>
    </div>
  )
}
