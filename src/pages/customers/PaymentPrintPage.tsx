import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { storePath } from '../../catalog/api'
import { QueryState } from '../../components/ui/QueryState'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useWorkspace } from '../../hooks/useWorkspace'
import { paymentSlipText } from '../../customers/repayments/paymentSlip'
import type { RepaymentReply } from '../../customers/repayments/types'

export default function PaymentPrintPage() {
  const { store } = useWorkspace(),
    { customerId, paymentId } = useParams()
  const valid = [customerId, paymentId].every(
    (id) => Number.isSafeInteger(Number(id)) && Number(id) > 0,
  )
  const result = useStoreQuery<RepaymentReply>(
    store && valid ? `${storePath(store.id)}/customers/${customerId}/payments/${paymentId}` : null,
  )
  return (
    <main className="mx-auto min-h-screen max-w-xl bg-white p-5 sm:p-8 print:max-w-none">
      <div className="page-actions mb-6 flex flex-wrap justify-between gap-3 print:hidden">
        <Link to="/customers" className="btn btn-secondary">
          <ArrowLeft size={15} />
          Customers
        </Link>
        <button className="btn btn-primary" disabled={!result.data} onClick={() => window.print()}>
          <Printer size={15} />
          Print payment slip
        </button>
      </div>
      {!valid ? (
        <p role="alert">This payment was not found in your store.</p>
      ) : (
        <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      )}
      {result.data && (
        <>
          <h1 className="mb-5 font-display text-xl font-bold">{store?.name}</h1>
          <p className="whitespace-pre-wrap break-words text-sm leading-loose">
            {paymentSlipText(result.data.data)}
          </p>
        </>
      )}
    </main>
  )
}
