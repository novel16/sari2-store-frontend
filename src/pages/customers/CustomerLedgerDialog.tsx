import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Banknote } from 'lucide-react'
import { Modal } from '../../components/ui'
import { Pagination } from '../../components/ui/Pagination'
import { QueryState } from '../../components/ui/QueryState'
import { storePath } from '../../catalog/api'
import type { CustomerLedgerResponse, CustomerSelection } from '../../customers/types'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { money } from '../../lib/format'
import { saleDateTime } from '../../sales/format'
import { decreasesBalance, entryLabel } from '../../customers/statements/format'
import PaymentSlipActions from '../../customers/repayments/PaymentSlipActions'

export default function CustomerLedgerDialog({
  storeId,
  customerId,
  onClose,
  onPayment,
  paymentLocked,
}: {
  storeId: number
  customerId: number
  onClose: () => void
  onPayment: (customer: CustomerSelection) => void
  paymentLocked: boolean
}) {
  const [page, setPage] = useState(1)
  const result = useStoreQuery<CustomerLedgerResponse>(
    `${storePath(storeId)}/customers/${customerId}/ledger?page=${page}&per_page=10`,
  )
  return (
    <Modal title="Customer ledger" onClose={onClose}>
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {result.data && (
        <>
          <strong className="block break-words text-sm">{result.data.customer.name}</strong>
          <Link
            className="btn btn-secondary my-3"
            to={`/customers/${customerId}/statement`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View / print statement
          </Link>
          {result.data.customer.phone && (
            <p className="mt-1 text-xs text-stone-500">{result.data.customer.phone}</p>
          )}
          {result.data.customer.notes && (
            <p className="mt-2 whitespace-pre-wrap break-words text-xs text-stone-500">
              {result.data.customer.notes}
            </p>
          )}
          <div className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-amber-900">
            <span className="text-xs">Outstanding utang</span>
            <strong className="text-xl">{money(result.data.customer.balance_centavos)}</strong>
          </div>
          <ol className="divide-y divide-stone-100">
            {result.data.data.map((entry) => (
              <li key={entry.id} className="space-y-2 py-4 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>{entryLabel(entry)}</strong>
                  <strong className={decreasesBalance(entry) ? 'text-forest' : 'text-amber-900'}>
                    {decreasesBalance(entry) ? '−' : '+'}
                    {money(entry.amount_centavos)}
                  </strong>
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-[11px] text-stone-500">
                  {entry.sale_id && (
                    <Link
                      className="text-forest underline"
                      to={`/sales?sale_id=${entry.sale_id}`}
                      onClick={onClose}
                    >
                      {entry.sale_number}
                    </Link>
                  )}
                  <span>{saleDateTime.format(new Date(entry.created_at))}</span>
                </div>
                {entry.payment_number && (
                  <p className="text-[11px] font-semibold text-forest">{entry.payment_number}</p>
                )}
                {entry.opening_number && (
                  <p className="text-[11px] font-semibold text-amber-900">{entry.opening_number}</p>
                )}
                {entry.entry_type === 'payment' && (
                  <PaymentSlipActions entry={entry} customerId={customerId} />
                )}
                {entry.reversal && (
                  <Link
                    className="block text-xs font-semibold text-forest underline"
                    to={`/sales?sale_id=${entry.reversal.sale_id}`}
                    onClick={onClose}
                  >
                    {entry.reversal.reference} · {entry.reversal.sale_number}
                  </Link>
                )}
                <p className="text-[11px] text-stone-500">
                  Recorded by {entry.recorded_by.name ?? 'Store owner'}
                </p>
                {entry.notes && (
                  <p className="whitespace-pre-wrap break-words text-xs text-stone-600">
                    {entry.notes}
                  </p>
                )}
                <p className="text-[11px] text-stone-500">
                  Balance after: {money(entry.balance_after_centavos)}
                </p>
              </li>
            ))}
          </ol>
          {!result.data.data.length && (
            <p className="py-5 text-center text-xs text-stone-500">No utang transactions yet.</p>
          )}
          <Pagination meta={result.data.meta} onPage={setPage} />
        </>
      )}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
        {result.data && BigInt(result.data.customer.balance_centavos) > 0n && (
          <button
            className="btn btn-primary"
            disabled={paymentLocked}
            onClick={() => onPayment(result.data!.customer)}
          >
            <Banknote size={15} />
            Record payment
          </button>
        )}
      </div>
    </Modal>
  )
}
