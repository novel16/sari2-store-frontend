import { CheckCircle2 } from 'lucide-react'
import { Modal } from '../../components/ui'
import { money } from '../../lib/format'
import { saleDateTime } from '../../sales/format'
import type { RepaymentReply } from './types'
import PaymentSlipActions from './PaymentSlipActions'

export default function RepaymentSavedDialog({
  reply,
  onClose,
}: {
  reply: RepaymentReply
  onClose: () => void
}) {
  const entry = reply.data
  return (
    <Modal title="Payment recorded" onClose={onClose}>
      <p role="status" className="mb-5 flex items-center gap-2 text-xs text-forest">
        <CheckCircle2 size={18} />
        The cash payment is saved and the utang balance is updated.
      </p>
      <div className="rounded-xl border border-stone-200 p-5">
        <strong className="block break-words text-sm">
          {entry.customer?.name ?? reply.customer.name}
        </strong>
        <p className="mt-2 text-[11px] text-stone-500">{entry.payment_number} · Cash</p>
        <dl className="mt-5 space-y-3 text-xs">
          <div className="flex justify-between gap-4">
            <dt>Utang before payment</dt>
            <dd>{money(entry.balance_before_centavos)}</dd>
          </div>
          <div className="flex justify-between gap-4 font-semibold text-forest">
            <dt>Payment received</dt>
            <dd>{money(entry.amount_centavos)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-t border-stone-200 pt-4 font-semibold">
            <dt>Balance after payment</dt>
            <dd className="text-lg">{money(entry.balance_after_centavos)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[11px] text-stone-500">
          Recorded by {entry.recorded_by.name} · {saleDateTime.format(new Date(entry.created_at))}
        </p>
        {entry.notes && (
          <p className="mt-3 whitespace-pre-wrap break-words text-xs text-stone-600">
            {entry.notes}
          </p>
        )}
      </div>
      <PaymentSlipActions entry={entry} customerId={reply.customer.id} />
      <div className="form-actions">
        <button className="btn btn-primary" data-autofocus onClick={onClose}>
          Back to ledger
        </button>
      </div>
    </Modal>
  )
}
