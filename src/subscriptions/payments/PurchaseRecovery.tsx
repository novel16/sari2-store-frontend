import type { PurchaseState } from './usePurchase'

export default function PurchaseRecovery({ purchase }: { purchase: PurchaseState }) {
  return (
    <section className="panel my-5 p-5 sm:p-6" aria-labelledby="recovery-heading">
      <h2 id="recovery-heading" className="text-sm font-semibold text-forest">
        Recover your checkout
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-stone-500">
        Your last checkout result is not confirmed. Check for its saved order, or retry the same
        request before starting another payment.
      </p>
      {purchase.error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {purchase.error.message}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="btn btn-primary"
          disabled={purchase.pending}
          onClick={() => void purchase.check()}
        >
          {purchase.pending ? 'Checking checkout…' : 'Check saved order'}
        </button>
        <button
          className="btn btn-secondary"
          disabled={purchase.pending}
          onClick={() => void purchase.retry()}
        >
          Retry same checkout
        </button>
      </div>
    </section>
  )
}
