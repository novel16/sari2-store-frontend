import { Link } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import type { CreditEntry } from '../types'
import { downloadText } from '../../lib/downloadText'
import { paymentSlipText } from './paymentSlip'
export default function PaymentSlipActions({
  entry,
  customerId,
}: {
  entry: CreditEntry
  customerId: number
}) {
  return (
    <div className="form-actions">
      <button
        className="btn btn-secondary"
        onClick={() =>
          downloadText(
            `${entry.payment_number ?? `payment-${entry.id}`}.txt`,
            paymentSlipText(entry),
          )
        }
      >
        <Download size={15} />
        Download slip
      </button>
      <Link
        className="btn btn-secondary"
        to={`/customers/${customerId}/payments/${entry.id}/print`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Printer size={15} />
        Print payment slip
      </Link>
    </div>
  )
}
