import { Modal } from '../components/ui'
import FormError from '../auth/components/FormError'
import { money } from '../lib/format'
import type { CashOperation, CashOutcome } from './useCashOperation'
import { useRef } from 'react'

export default function ReviewCashChange({
  title,
  label,
  amount,
  notes,
  warning,
  operation,
  onBack,
  onConfirm,
}: {
  title: string
  label: string
  amount: number
  notes: string | null
  warning?: string
  operation: CashOperation
  onBack: () => void
  onConfirm: () => Promise<CashOutcome>
}) {
  const busy = useRef(false)
  async function confirm() {
    if (busy.current || operation.pending || operation.attempt) return
    busy.current = true
    try {
      if ((await onConfirm()) === 'rejected') onBack()
    } finally {
      busy.current = false
    }
  }
  return (
    <Modal
      title={title}
      dismissible={!operation.pending}
      onClose={() => {
        if (!busy.current) onBack()
      }}
    >
      <p className="text-xs text-stone-500">{label}</p>
      <strong className="my-4 block text-2xl">{money(amount)}</strong>
      {notes && (
        <p className="mb-5 whitespace-pre-wrap break-words text-sm text-stone-600">{notes}</p>
      )}
      {warning && (
        <p className="my-5 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          {warning}
        </p>
      )}
      <FormError error={operation.error} />
      <div className="form-actions">
        <button className="btn btn-secondary" disabled={operation.pending} onClick={onBack}>
          Back to details
        </button>
        <button
          className="btn btn-primary"
          disabled={operation.pending}
          onClick={() => void confirm()}
        >
          {operation.pending ? 'Saving...' : 'Confirm & save'}
        </button>
      </div>
    </Modal>
  )
}
