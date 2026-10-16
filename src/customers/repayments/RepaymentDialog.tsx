import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Banknote, Check, LoaderCircle } from 'lucide-react'
import { Modal } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import FormError from '../../auth/components/FormError'
import { storePath } from '../../catalog/api'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { money } from '../../lib/format'
import type { CustomerLedgerResponse, CustomerSelection } from '../types'
import type { RepaymentState } from './useRepayment'
import { repaymentAmounts } from './recovery'
import RepaymentRecovery from './RepaymentRecovery'

type Review = { customer: CustomerSelection; amount: number; notes: string }

export default function RepaymentDialog({
  storeId,
  customer,
  repayment,
  onClose,
}: {
  storeId: number
  customer: CustomerSelection
  repayment: RepaymentState
  onClose: () => void
}) {
  const initial = repayment.attempt
  const [amount, setAmount] = useState(
    initial ? (initial.input.amount_centavos / 100).toFixed(2) : '',
  )
  const [notes, setNotes] = useState(initial?.input.notes ?? '')
  const [review, setReview] = useState<Review | null>(
    initial
      ? {
          customer: initial.customer,
          amount: initial.input.amount_centavos,
          notes: initial.input.notes ?? '',
        }
      : null,
  )
  const seenRevision = useRef(repayment.revision)
  const confirming = useRef(false)
  const result = useStoreQuery<CustomerLedgerResponse>(
    `${storePath(storeId)}/customers/${customer.id}/ledger?per_page=1`,
  )
  const reloadLedger = result.reload
  useEffect(() => {
    if (seenRevision.current !== repayment.revision) {
      seenRevision.current = repayment.revision
      reloadLedger()
    }
  }, [repayment.revision, reloadLedger])
  const current = result.data?.customer
  const totals = repaymentAmounts(amount, current?.balance_centavos ?? '0')
  const recovery = Boolean(repayment.attempt && !repayment.pending)
  const phase = recovery ? 'recovery' : review ? 'review' : 'edit'

  function startReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!current || totals.error || repayment.pending || repayment.attempt) return
    repayment.clearError()
    setReview({ customer: current, amount: totals.amount, notes: notes.trim() })
  }
  async function confirm() {
    if (!review || confirming.current) return
    confirming.current = true
    try {
      if ((await repayment.record(review.customer, review.amount, review.notes)) === 'rejected')
        setReview(null)
    } finally {
      confirming.current = false
    }
  }
  async function retry() {
    if ((await repayment.retry()) === 'rejected') setReview(null)
  }
  return (
    <Modal
      key={phase}
      title={
        phase === 'edit'
          ? 'Record a payment'
          : phase === 'recovery'
            ? 'Confirm payment status'
            : 'Review cash repayment'
      }
      dismissible={!repayment.pending}
      onClose={() => {
        if (!confirming.current && !repayment.pending) onClose()
      }}
    >
      {phase === 'edit' ? (
        <>
          <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
          {current && (
            <form onSubmit={startReview}>
              <strong className="block break-words text-sm">{current.name}</strong>
              {current.phone && <p className="mt-1 text-xs text-stone-500">{current.phone}</p>}
              <div className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-amber-900">
                <span className="text-xs">Outstanding utang</span>
                <strong className="text-xl">{money(current.balance_centavos)}</strong>
              </div>
              <FormError error={repayment.error} />
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-forest/5 p-3 text-xs font-semibold text-forest">
                  <Banknote size={17} />
                  Cash repayment
                </div>
                <label className="field">
                  <span>Payment received (₱)</span>
                  <input
                    name="repayment_amount"
                    aria-label="Repayment amount in pesos"
                    data-autofocus
                    autoFocus
                    required
                    type="number"
                    min="0.01"
                    max={Math.min(Number(current.balance_centavos), 1000000000) / 100}
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                  />
                  {repayment.error?.fields.amount_centavos?.[0] && (
                    <small className="text-red-700">
                      {repayment.error.fields.amount_centavos[0]}
                    </small>
                  )}
                </label>
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  disabled={
                    BigInt(current.balance_centavos) === 0n ||
                    BigInt(current.balance_centavos) > 1000000000n
                  }
                  onClick={() => setAmount((Number(current.balance_centavos) / 100).toFixed(2))}
                >
                  Pay full balance
                </button>
                <label className="field">
                  <span>Notes (optional)</span>
                  <textarea
                    name="repayment_notes"
                    maxLength={255}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="e.g. Partial payment received today"
                  />
                  {repayment.error?.fields.notes?.[0] && (
                    <small className="text-red-700">{repayment.error.fields.notes[0]}</small>
                  )}
                </label>
                {amount && totals.error && <p className="text-xs text-red-700">{totals.error}</p>}
                <div className="flex flex-wrap justify-between gap-3 text-xs">
                  <span>Balance after payment</span>
                  <strong className="text-forest">{money(totals.remaining)}</strong>
                </div>
                {current.balance_centavos === '0' && (
                  <p className="text-xs text-stone-500">This customer has no outstanding utang.</p>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={Boolean(totals.error)}>
                  Review payment
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <>
          <RepaymentReviewDetails
            customer={repayment.attempt?.customer ?? review!.customer}
            amount={repayment.attempt?.input.amount_centavos ?? review!.amount}
            notes={repayment.attempt?.input.notes ?? review?.notes ?? ''}
          />
          {recovery ? (
            <div className="mt-5">
              <RepaymentRecovery repayment={repayment} onRetry={() => void retry()} />
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                  Back to ledger
                </button>
              </div>
            </div>
          ) : (
            <>
              {repayment.pending && (
                <p role="status" className="mt-5 text-xs text-stone-500">
                  Saving or checking your payment. Please wait…
                </p>
              )}
              <div className="mt-6 grid gap-3 border-t border-stone-100 pt-5 sm:grid-cols-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-autofocus
                  disabled={repayment.pending}
                  onClick={() => setReview(null)}
                >
                  <ArrowLeft size={15} />
                  Back to payment
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={repayment.pending}
                  onClick={() => void confirm()}
                >
                  {repayment.pending ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                  {repayment.pending ? 'Saving payment…' : 'Confirm & record payment'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}

function RepaymentReviewDetails({
  customer,
  amount,
  notes,
}: {
  customer: CustomerSelection
  amount: number
  notes: string
}) {
  return (
    <>
      <p className="mb-4 text-xs leading-relaxed text-stone-500">
        Confirm that you received this cash payment. It will reduce this customer's utang.
      </p>
      <strong className="block break-words text-sm">{customer.name}</strong>
      {customer.phone && <p className="mt-1 text-xs text-stone-500">{customer.phone}</p>}
      <dl className="mt-5 space-y-4 rounded-xl border border-stone-200 p-4 text-xs">
        <div className="flex flex-wrap justify-between gap-3">
          <dt>Outstanding before payment</dt>
          <dd>{money(customer.balance_centavos)}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-dashed border-stone-200 py-4 font-semibold">
          <dt>Cash payment received</dt>
          <dd className="text-2xl text-forest">{money(amount)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-3 font-semibold">
          <dt>Balance after payment</dt>
          <dd>{money((BigInt(customer.balance_centavos) - BigInt(amount)).toString())}</dd>
        </div>
      </dl>
      {notes && (
        <p className="mt-4 whitespace-pre-wrap break-words text-xs text-stone-600">{notes}</p>
      )}
    </>
  )
}
