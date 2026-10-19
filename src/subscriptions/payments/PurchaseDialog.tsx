import { useState } from 'react'
import { Modal } from '../../components/ui'
import { money } from '../../lib/format'
import type { AuthError } from '../../auth/errors'
import type { Plan } from '../types'

export default function PurchaseDialog({
  plan,
  pending,
  error,
  locked,
  onConfirm,
  onClose,
}: {
  plan: Plan
  pending: boolean
  error: AuthError | null
  locked: boolean
  onConfirm: (months: number) => void
  onClose: () => void
}) {
  const [months, setMonths] = useState(1)
  const [review, setReview] = useState(false)
  return (
    <Modal
      title={review ? 'Review subscription payment' : `Get ${plan.name}`}
      onClose={onClose}
      dismissible={!pending}
    >
      <p className="text-sm text-stone-500">
        Pay once using QR Ph. Each renewal needs another payment.
      </p>
      <label className="mt-5 block text-xs font-semibold">
        Months
        <select
          className="input mt-2 w-full"
          value={months}
          disabled={review || pending}
          onChange={(event) => setMonths(Number(event.target.value))}
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? 'month' : 'months'}
            </option>
          ))}
        </select>
      </label>
      <dl className="my-5 space-y-3 rounded-xl bg-forest/5 p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt>Plan</dt>
          <dd>{plan.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Monthly price</dt>
          <dd>{money(plan.monthly_price_centavos)}</dd>
        </div>
        <div className="flex justify-between gap-3 font-semibold text-forest">
          <dt>Total</dt>
          <dd>{money(plan.monthly_price_centavos * months)}</dd>
        </div>
      </dl>
      <p className="text-xs leading-relaxed text-stone-500">
        Paid coverage starts after verified payment, or follows your existing paid coverage. Your
        saved price and allowances apply to this purchase. If the offer changed, refresh and review
        it again.
      </p>
      {error && (
        <div role="alert" className="mt-4 text-xs text-red-700">
          {error.message}
          {Object.values(error.fields)
            .flat()
            .map((message) => (
              <p key={message}>{message}</p>
            ))}
        </div>
      )}
      <div className="form-actions">
        <button
          className="btn btn-secondary"
          disabled={pending}
          onClick={review ? () => setReview(false) : onClose}
        >
          {review ? 'Back' : 'Cancel'}
        </button>
        <button
          className="btn btn-primary"
          disabled={pending || locked}
          onClick={() => (review ? onConfirm(months) : setReview(true))}
        >
          {pending ? 'Creating checkout…' : review ? 'Proceed to QR Ph payment' : 'Review payment'}
        </button>
      </div>
    </Modal>
  )
}
