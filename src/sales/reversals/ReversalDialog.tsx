import { useRef, useState } from 'react'
import { Modal } from '../../components/ui'
import FormError from '../../auth/components/FormError'
import { useMutation } from '../../hooks/useMutation'
import { money } from '../../lib/format'
import { reversalApi } from './api'
import type { ReversalQuote } from './types'
import type { ReversalState } from './useReversal'

export default function ReversalDialog({
  storeId,
  saleId,
  state,
  onClose,
}: {
  storeId: number
  saleId: number
  state: ReversalState
  onClose: () => void
}) {
  const [kind, setKind] = useState<'void' | 'refund'>('void')
  const [reason, setReason] = useState('')
  const [restock, setRestock] = useState(true)
  const [cashConfirmed, setCashConfirmed] = useState(false)
  const [quote, setQuote] = useState<ReversalQuote | null>(null)
  const loading = useMutation()
  const confirming = useRef(false)
  const pending = loading.pending || state.pending
  const close = () => {
    if (!pending && !confirming.current) onClose()
  }
  async function review() {
    state.clearError()
    await loading.run(async () => {
      setQuote(await reversalApi.preview(storeId, saleId))
      setCashConfirmed(false)
    })
  }
  async function confirm() {
    if (
      !quote ||
      confirming.current ||
      pending ||
      (quote.cash_refund_centavos > 0 && !cashConfirmed)
    )
      return
    confirming.current = true
    const outcome = await state.record(quote, {
      kind,
      reason: reason.trim(),
      restock,
      expected_balance_centavos: quote.balance_before_centavos,
      cash_confirmed: quote.cash_refund_centavos === 0 || cashConfirmed,
    })
    confirming.current = false
    if (outcome === 'rejected') {
      setQuote(null)
      setCashConfirmed(false)
    }
  }
  return (
    <Modal
      key={state.attempt ? 'recovery' : quote ? 'review' : 'edit'}
      title={
        state.attempt
          ? 'Check pending void / refund'
          : quote
            ? 'Review full-sale reversal'
            : 'Void / refund sale'
      }
      onClose={close}
      dismissible={!pending}
    >
      <FormError error={state.error ?? loading.error} />
      {state.attempt ? (
        <>
          <p className="text-sm leading-relaxed">
            The {state.attempt.input.kind} for <strong>{state.attempt.sale_number}</strong> may
            already be saved. Check it or retry the exact same request.
          </p>
          <div className="form-actions">
            <button className="btn btn-secondary" disabled={pending} onClick={close}>
              Close
            </button>
            <button
              className="btn btn-secondary"
              disabled={pending}
              onClick={() => void state.check()}
            >
              Check saved reversal
            </button>
            <button
              className="btn btn-primary"
              disabled={pending}
              onClick={() => void state.retry()}
            >
              Retry same reversal
            </button>
          </div>
        </>
      ) : quote ? (
        <>
          <p className="mb-4 text-sm font-semibold">
            {quote.sale_number} · {kind === 'void' ? 'Void full sale' : 'Refund full sale'}
          </p>
          <dl className="space-y-3 rounded-xl bg-paper p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Original sale total</dt>
              <dd>{money(quote.total_centavos)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-semibold">
              <dt>Cash to refund</dt>
              <dd>{money(quote.cash_refund_centavos)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Reduce utang by</dt>
              <dd>{money(quote.credit_reversed_centavos)}</dd>
            </div>
            {quote.balance_after_centavos !== null && (
              <div className="flex justify-between gap-3">
                <dt>Customer balance after</dt>
                <dd>{money(quote.balance_after_centavos)}</dd>
              </div>
            )}
          </dl>
          {quote.customer && (
            <p className="mt-4 text-xs leading-relaxed">
              {quote.customer.name}: this reduces their total outstanding utang first. The remaining
              refund is returned as cash.
            </p>
          )}
          <p className="mt-4 text-xs">
            <strong>Stock:</strong>{' '}
            {restock ? 'Return all items to stock' : 'Do not return items to stock'}
          </p>
          <ul className="my-3 space-y-1 text-xs text-stone-500">
            {quote.items.map((item) => (
              <li key={item.product_id}>
                {item.quantity} × {item.name}
              </li>
            ))}
          </ul>
          <p className="mb-4 break-words text-xs">
            <strong>Reason:</strong> {reason}
          </p>
          {quote.cash_refund_centavos > 0 && (
            <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed">
              <input
                className="mt-0.5"
                type="checkbox"
                checked={cashConfirmed}
                disabled={pending}
                onChange={(event) => setCashConfirmed(event.target.checked)}
              />
              <span>
                I confirm the cash refund / cash correction of {money(quote.cash_refund_centavos)}.
                This records the adjustment; it does not send electronic payment.
              </span>
            </label>
          )}
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              data-autofocus
              disabled={pending}
              onClick={() => {
                setQuote(null)
                setCashConfirmed(false)
              }}
            >
              Back to details
            </button>
            <button
              className="btn btn-primary"
              disabled={pending || (quote.cash_refund_centavos > 0 && !cashConfirmed)}
              onClick={() => void confirm()}
            >
              {pending ? 'Saving…' : 'Confirm & save reversal'}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void review()
          }}
        >
          <fieldset disabled={pending} className="space-y-4">
            <label className="field">
              <span>Action</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as 'void' | 'refund')}
              >
                <option value="void">Void — correct an accidental sale</option>
                <option value="refund">Refund — return the full sale</option>
              </select>
            </label>
            <label className="field">
              <span>Reason</span>
              <textarea
                name="reason"
                data-autofocus
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                minLength={3}
                maxLength={255}
                rows={3}
              />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={restock}
                onChange={(event) => setRestock(event.target.checked)}
              />
              <span>
                Return all items to stock
                <br />
                <small className="text-stone-500">
                  Uncheck for damaged, missing, or unsellable items.
                </small>
              </span>
            </label>
            <p className="text-xs text-stone-500">
              Full-sale reversal only. Original sale details remain in history; this action cannot
              be repeated for the same sale.
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={close}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {pending ? 'Loading…' : 'Review reversal'}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </Modal>
  )
}
