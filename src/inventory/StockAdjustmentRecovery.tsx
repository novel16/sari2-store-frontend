import { RefreshCw } from 'lucide-react'
import FormError from '../auth/components/FormError'
import type { StockAdjustmentState } from './useStockAdjustment'

export default function StockAdjustmentRecovery({
  adjustment,
}: {
  adjustment: StockAdjustmentState
}) {
  const attempt = adjustment.attempt
  return (
    <section
      className="mb-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-5"
      aria-label="Stock adjustment recovery"
    >
      <h2 className="text-sm font-bold text-amber-950">
        {attempt ? 'A stock adjustment needs confirmation' : 'Stock recovery needs attention'}
      </h2>
      {attempt && (
        <>
          <p className="text-xs leading-relaxed text-amber-900">
            This adjustment may already be saved. Confirm the same adjustment before starting
            another. Retrying will keep its original details and will not change stock twice.
          </p>
          <p className="text-xs text-amber-950">
            <strong>{attempt.product.name}</strong>
            {' · '}{attempt.input.mode === 'set' ? 'Set count to' : attempt.input.mode === 'add' ? 'Add' : 'Remove'}
            {' '}{attempt.input.quantity} {attempt.product.unit}(s)
            {' · '}{attempt.input.reason}
          </p>
        </>
      )}
      <FormError error={adjustment.error} />
      {attempt && !adjustment.blocked && (
        <button
          type="button"
          className="btn btn-primary"
          disabled={adjustment.pending}
          onClick={() => void adjustment.retry()}
        >
          <RefreshCw size={15} />
          {adjustment.pending ? 'Confirming…' : 'Retry same adjustment'}
        </button>
      )}
    </section>
  )
}