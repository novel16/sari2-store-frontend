import { useState } from 'react'
import type { FormEvent } from 'react'
import FormError from '../auth/components/FormError'
import { cashAmount, cashInput } from './format'
import ReviewCashChange from './ReviewCashChange'
import type { CashOperation } from './useCashOperation'

export default function OpenCashDay({
  businessDate,
  operation,
}: {
  businessDate: string
  operation: CashOperation
}) {
  const rejected = operation.rejectedAttempt
  const draft =
    rejected?.kind === 'open' && rejected.business_date === businessDate ? rejected.input : null
  const [amount, setAmount] = useState(() =>
    draft ? cashInput(String(draft.opening_cash_centavos)) : '',
  )
  const [notes, setNotes] = useState(() => draft?.notes ?? '')
  const [reviewValue, setReviewValue] = useState<{ amount: number; revision: number } | null>(null)
  const review = reviewValue?.revision === operation.rejectionRevision ? reviewValue.amount : null
  const setReview = (amount: number | null) =>
    setReviewValue(amount === null ? null : { amount, revision: operation.rejectionRevision })
  const [error, setError] = useState('')
  const locked = operation.pending || Boolean(operation.attempt) || operation.blocked
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked) return
    try {
      setReview(cashAmount(amount))
      setError('')
      operation.clearError()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Enter valid opening cash.')
    }
  }
  return (
    <section className="panel p-5 sm:p-7">
      <h2 className="text-lg font-bold">Open cash day - {businessDate}</h2>
      <p className="my-4 text-sm leading-relaxed text-stone-500">
        Enter the cash float at the start of this business day, before all of today's recorded
        activity. Today's cash sales, payments and refunds will be included automatically.
      </p>
      <form onSubmit={submit}>
        <fieldset disabled={locked || review !== null} className="space-y-4">
          <label className="field">
            Opening cash (PHP)
            <input
              name="opening_cash"
              inputMode="decimal"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="field">
            Opening notes (optional)
            <textarea
              name="opening_notes"
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
          <button className="btn btn-primary">Review opening cash</button>
        </fieldset>
      </form>
      {!operation.attempt && <FormError error={operation.error} />}
      <p className="mt-5 text-xs leading-relaxed text-stone-500">
        Cash tracking is optional. Without an opened cash day, normal cash transactions remain
        available.
      </p>
      {review !== null && !operation.attempt && (
        <ReviewCashChange
          title="Review opening cash"
          label={businessDate + ' - opening float'}
          amount={review}
          notes={notes.trim() || null}
          operation={operation}
          onBack={() => setReview(null)}
          warning="This opening cash cannot be edited later; corrections use audited cash in/out. It is the starting float before all recorded events for this day, not a sale or income."
          onConfirm={() =>
            operation.start({
              kind: 'open',
              business_date: businessDate,
              opening_cash_centavos: review,
              notes: notes.trim() || null,
            })
          }
        />
      )}
    </section>
  )
}
