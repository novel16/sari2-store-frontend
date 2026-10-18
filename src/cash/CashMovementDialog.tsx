import { useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../components/ui'
import FormError from '../auth/components/FormError'
import { cashAmount, cashInput } from './format'
import ReviewCashChange from './ReviewCashChange'
import type { CashDay } from './types'
import type { CashOperation } from './useCashOperation'

export default function CashMovementDialog({
  day,
  operation,
  onClose,
}: {
  day: CashDay
  operation: CashOperation
  onClose: () => void
}) {
  const rejected = operation.rejectedAttempt
  const draft = rejected?.kind === 'movement' && rejected.day_id === day.id ? rejected.input : null
  const [direction, setDirection] = useState<'in' | 'out'>(() => draft?.direction ?? 'in')
  const [amount, setAmount] = useState(() =>
    draft ? cashInput(String(draft.amount_centavos)) : '',
  )
  const [reason, setReason] = useState(() => draft?.reason ?? '')
  const [reviewValue, setReviewValue] = useState<{ amount: number; revision: number } | null>(null)
  const review = reviewValue?.revision === operation.rejectionRevision ? reviewValue.amount : null
  const setReview = (amount: number | null) =>
    setReviewValue(amount === null ? null : { amount, revision: operation.rejectionRevision })
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      if (reason.trim().length < 3) throw new Error('Enter a reason of at least 3 characters.')
      setReview(cashAmount(amount, false))
      setError('')
      operation.clearError()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Check the cash details.')
    }
  }
  if (operation.attempt) return null
  if (review !== null)
    return (
      <ReviewCashChange
        title={'Review cash ' + direction}
        label={day.business_date + ' - manual cash ' + direction}
        amount={review}
        notes={reason.trim()}
        operation={operation}
        onBack={() => setReview(null)}
        warning="This changes the cash drawer only. It does not create sales revenue or change customer utang."
        onConfirm={() =>
          operation.start({
            kind: 'movement',
            day,
            direction,
            amount_centavos: review,
            reason: reason.trim(),
          })
        }
      />
    )
  return (
    <Modal title="Record cash in or out" onClose={onClose}>
      <form onSubmit={submit}>
        <fieldset
          className="space-y-5"
          disabled={operation.pending || Boolean(operation.attempt) || operation.blocked}
        >
          <label className="field">
            Cash movement
            <select
              value={direction}
              onChange={(event) => setDirection(event.target.value as 'in' | 'out')}
            >
              <option value="in">Cash in</option>
              <option value="out">Cash out</option>
            </select>
          </label>
          <label className="field">
            Amount (PHP)
            <input
              name="movement_amount"
              inputMode="decimal"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="field">
            Reason
            <textarea
              name="movement_reason"
              required
              minLength={3}
              maxLength={255}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
          <FormError error={operation.error} />
          <div className="form-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary">Review cash movement</button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
