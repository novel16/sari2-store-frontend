import FormError from '../auth/components/FormError'
import { money } from '../lib/format'
import { varianceText } from './format'
import type { CashOperation } from './useCashOperation'

export default function CashRecovery({ operation }: { operation: CashOperation }) {
  const { attempt, blocked, pending } = operation
  if (!attempt && !blocked) return null
  const description =
    attempt?.kind === 'open'
      ? 'Opening cash'
      : attempt?.kind === 'movement'
        ? 'Manual cash ' + attempt.input.direction
        : 'Final cash closing'
  return (
    <section
      role="status"
      className="my-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
    >
      <h2 className="font-semibold">
        {blocked ? 'Cash recovery needs attention' : description + ' needs confirmation'}
      </h2>
      {attempt && (
        <p className="my-3 leading-relaxed">
          Business date {attempt.business_date} -{' '}
          {money(
            attempt.kind === 'open'
              ? attempt.input.opening_cash_centavos
              : attempt.kind === 'movement'
                ? attempt.input.amount_centavos
                : attempt.review.counted_cash_centavos,
          )}
        </p>
      )}
      {attempt?.kind === 'close' && (
        <p className="my-3 font-semibold">{varianceText(attempt.review.variance_centavos)}</p>
      )}
      {attempt && (
        <p className="my-3 whitespace-pre-wrap break-words text-xs">
          {attempt.kind === 'movement'
            ? attempt.input.reason
            : attempt.kind === 'close'
              ? attempt.review.notes
              : attempt.input.notes}
        </p>
      )}
      <p className="my-3 text-xs leading-relaxed">
        Confirm this saved request before starting another cash change. Retrying keeps the same
        details.
      </p>
      <FormError error={operation.error} />
      {attempt && !blocked && (
        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-secondary"
            disabled={pending}
            onClick={() => void operation.check()}
          >
            Check saved change
          </button>
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={() => void operation.retry()}
          >
            {pending ? 'Please wait...' : 'Retry same cash change'}
          </button>
        </div>
      )}
    </section>
  )
}
