import { RefreshCw, ShieldCheck } from 'lucide-react'
import FormError from '../../auth/components/FormError'
import type { AuthError } from '../../auth/errors'

export default function CheckoutRecovery({
  pending,
  error,
  onCheck,
  onRetry,
}: {
  pending: boolean
  error: AuthError | null
  onCheck: () => void
  onRetry: () => void
}) {
  return (
    <section
      className="mb-5 space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5"
      aria-label="Checkout recovery"
    >
      <h2 className="text-sm font-bold text-amber-950">A checkout needs confirmation</h2>
      <p className="text-xs leading-relaxed text-amber-900">
        This sale may already be saved. Check its status or retry the same checkout before starting
        another order. Retrying will not create another copy of a saved sale.
      </p>
      <FormError error={error} />
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={pending} onClick={onCheck}>
          <ShieldCheck size={15} />
          {pending ? 'Checking…' : 'Check saved sale'}
        </button>
        <button className="btn btn-secondary" disabled={pending} onClick={onRetry}>
          <RefreshCw size={15} />
          Retry same checkout
        </button>
      </div>
    </section>
  )
}
