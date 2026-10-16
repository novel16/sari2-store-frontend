import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../../components/ui'
import FormError from '../../auth/components/FormError'
import { money, parseCentavos } from '../../lib/format'
import type { CustomerSelection } from '../types'
import type { OpeningState } from './useOpeningBalance'

export default function OpeningBalanceDialog({
  customer,
  opening,
  onClose,
}: {
  customer: Pick<CustomerSelection, 'id' | 'name'>
  opening: OpeningState
  onClose: () => void
}) {
  const [amount, setAmount] = useState(''),
    [notes, setNotes] = useState(''),
    [review, setReview] = useState<{ amount: number; notes: string } | null>(null),
    [validation, setValidation] = useState('')
  const confirming = useRef(false)
  const phase = opening.receipt
    ? 'saved'
    : opening.attempt
      ? 'recovery'
      : review
        ? 'review'
        : 'edit'
  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const value = parseCentavos(amount)
      if (value < 1 || notes.trim().length < 3) throw new Error()
      setReview({ amount: value, notes: notes.trim() })
      setValidation('')
    } catch {
      setValidation(
        'Enter a positive amount up to ₱10,000,000.00 and a reason of at least 3 characters.',
      )
    }
  }
  async function confirm() {
    if (!review || confirming.current) return
    confirming.current = true
    try {
      if ((await opening.record(customer, review.amount, review.notes)) === 'rejected')
        setReview(null)
    } finally {
      confirming.current = false
    }
  }
  return (
    <Modal
      key={phase}
      title={
        phase === 'saved'
          ? 'Opening utang saved'
          : phase === 'recovery'
            ? 'Check opening utang'
            : phase === 'review'
              ? 'Review opening utang'
              : 'Record opening utang'
      }
      dismissible={!opening.pending}
      onClose={() => {
        if (!confirming.current) onClose()
      }}
    >
      <p className="mb-4 break-words text-sm font-semibold">{customer.name}</p>
      <FormError error={opening.error} />
      {phase === 'edit' ? (
        <form onSubmit={start}>
          <p className="mb-5 text-xs leading-relaxed text-stone-500">
            Transfer existing debt from your notebook. This one-time entry is available before the
            customer's first financial transaction. It records no sale, cash collection, or stock
            change.
          </p>
          {validation && (
            <p role="alert" className="mb-3 text-xs text-red-700">
              {validation}
            </p>
          )}
          <label className="field">
            <span>Existing utang (₱)</span>
            <input
              name="opening_amount"
              data-autofocus
              required
              type="number"
              min="0.01"
              max="10000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="field mt-4">
            <span>Reason / notebook reference</span>
            <textarea
              name="opening_notes"
              required
              minLength={3}
              maxLength={255}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Balance copied from notebook on Oct 16"
            />
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary">Review opening utang</button>
          </div>
        </form>
      ) : (
        <>
          <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {money(
              opening.receipt?.data.amount_centavos ??
                opening.attempt?.input.amount_centavos ??
                review?.amount ??
                0,
            )}
          </p>
          <p className="mt-4 whitespace-pre-wrap break-words text-xs text-stone-600">
            {opening.receipt?.data.notes ?? opening.attempt?.input.notes ?? review?.notes}
          </p>
          {phase === 'saved' ? (
            <>
              <p role="status" className="mt-4 text-xs text-forest">
                {opening.receipt?.data.opening_number} · Added once to the customer's ledger.
              </p>
              <div className="form-actions">
                <button className="btn btn-primary" data-autofocus onClick={onClose}>
                  Back to customers
                </button>
              </div>
            </>
          ) : phase === 'recovery' ? (
            <>
              <p className="mt-4 text-xs text-stone-500">
                Check whether this opening was saved before starting another. Retrying uses the same
                request.
              </p>
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  disabled={opening.pending}
                  onClick={() => void opening.check()}
                >
                  Check saved opening
                </button>
                <button
                  className="btn btn-primary"
                  disabled={opening.pending}
                  onClick={() => void opening.retry()}
                >
                  {opening.pending ? 'Please wait…' : 'Retry same opening'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-xs text-stone-500">
                Confirm the original debt amount. This opening cannot be edited or recorded a second
                time.
              </p>
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  data-autofocus
                  disabled={opening.pending}
                  onClick={() => setReview(null)}
                >
                  Back to details
                </button>
                <button
                  className="btn btn-primary"
                  disabled={opening.pending}
                  onClick={() => void confirm()}
                >
                  Confirm & record opening
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}
