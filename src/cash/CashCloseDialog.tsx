import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../components/ui'
import FormError from '../auth/components/FormError'
import { toApiError } from '../api/errors'
import { AuthError } from '../auth/errors'
import { useAuth } from '../auth/useAuth'
import { money } from '../lib/format'
import { cashApi } from './api'
import { cashAmount, cashDateTime, cashInput, varianceText } from './format'
import { copyCloseReview } from './recovery'
import CashBreakdown from './CashBreakdown'
import type { CashDayResult, CloseReview } from './types'
import type { CashOperation } from './useCashOperation'

export default function CashCloseDialog({
  day,
  operation,
  onClose,
}: {
  day: CashDayResult
  operation: CashOperation
  onClose: () => void
}) {
  const rejected = operation.rejectedAttempt
  const draft =
    rejected?.kind === 'close' && rejected.day_id === day.data.id ? rejected.review : null
  const [counted, setCounted] = useState(() =>
    draft ? cashInput(draft.counted_cash_centavos) : '',
  )
  const [notes, setNotes] = useState(() => draft?.notes ?? '')
  const [reviewState, setReviewState] = useState<{ value: CloseReview; revision: number } | null>(
    null,
  )
  const review = reviewState?.revision === operation.rejectionRevision ? reviewState.value : null
  const setReview = (value: CloseReview | null) =>
    setReviewState(value ? { value, revision: operation.rejectionRevision } : null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const busy = useRef(false)
  const mounted = useRef(true)
  const { refresh } = useAuth()
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  async function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || operation.pending || operation.attempt || operation.blocked) return
    let amount: number
    try {
      amount = cashAmount(counted)
    } catch (failure) {
      setError(new AuthError(failure instanceof Error ? failure.message : 'Check the count.'))
      return
    }
    busy.current = true
    setPending(true)
    setError(null)
    operation.clearError()
    try {
      const value = copyCloseReview(
        await cashApi.preview(day.data.store_id, day.data.id, amount, notes.trim() || null),
        day.data.store_id,
      )
      if (value.cash_day_id !== day.data.id)
        throw new Error('This review does not match the selected cash day.')
      if (mounted.current) setReview(value)
    } catch (failure) {
      if (mounted.current) setError(toApiError(failure))
      const next = toApiError(failure)
      if (next.status === 401 || next.status === 403) await refresh()
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }
  async function confirm() {
    if (!review || busy.current || operation.pending || operation.attempt) return
    busy.current = true
    try {
      if ((await operation.start({ kind: 'close', review })) === 'rejected') setReview(null)
    } finally {
      busy.current = false
    }
  }
  const shownError = error ?? operation.error
  const countError = shownError?.fields.counted_cash_centavos?.[0]
  const notesError = shownError?.fields.notes?.[0]
  // Keep the edited count/notes mounted while the financial attempt is recovered.
  if (operation.attempt) return null
  return (
    <Modal
      title={review ? 'Review final cash closing' : 'Count cash drawer'}
      wide
      dismissible={!pending && !operation.pending}
      onClose={() => {
        if (!busy.current) onClose()
      }}
    >
      <p className="mb-5 text-sm font-semibold">Business date {day.data.business_date}</p>
      <FormError error={shownError} />
      {review ? (
        <>
          <CashBreakdown totals={review.totals} />
          <dl className="my-5 space-y-3 rounded-xl bg-paper p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Counted cash</dt>
              <dd className="font-bold">{money(review.counted_cash_centavos)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Difference</dt>
              <dd className="font-bold">{varianceText(review.variance_centavos)}</dd>
            </div>
          </dl>
          {review.notes && (
            <p className="mb-4 whitespace-pre-wrap break-words text-sm">{review.notes}</p>
          )}
          <p className="rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            This closing is final and cannot be reopened. Cash sales, cash utang payments and cash
            refunds for a closed business day are blocked. Utang-only sales remain available.
          </p>
          <p className="mt-4 text-xs text-stone-500">
            Review valid until {cashDateTime(review.expires_at)}. New cash activity requires a fresh
            review.
          </p>
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              disabled={operation.pending}
              onClick={() => setReview(null)}
            >
              Back to count
            </button>
            <button
              className="btn btn-primary"
              disabled={operation.pending}
              onClick={() => void confirm()}
            >
              Confirm final closing
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={(event) => void preview(event)}>
          <fieldset
            className="space-y-5"
            disabled={pending || operation.pending || operation.blocked}
          >
            <p className="text-sm text-stone-500">
              Count the physical cash in the drawer. Review the server totals before closing.
            </p>
            <label className="field">
              Counted cash (PHP)
              <input
                name="counted_cash"
                required
                inputMode="decimal"
                value={counted}
                onChange={(event) => setCounted(event.target.value)}
                aria-invalid={Boolean(countError)}
                aria-describedby={countError ? 'cash-count-error' : undefined}
              />
              {countError && (
                <p id="cash-count-error" role="alert" className="text-xs text-red-700">
                  {countError}
                </p>
              )}
            </label>
            <label className="field">
              Closing notes (required for a difference)
              <textarea
                name="closing_notes"
                maxLength={500}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                aria-invalid={Boolean(notesError)}
                aria-describedby={notesError ? 'cash-notes-error' : undefined}
              />
              {notesError && (
                <p id="cash-notes-error" role="alert" className="text-xs text-red-700">
                  {notesError}
                </p>
              )}
            </label>
            <div className="form-actions">
              <button className="btn btn-secondary" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary">
                {pending ? 'Preparing review...' : 'Review final closing'}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </Modal>
  )
}
