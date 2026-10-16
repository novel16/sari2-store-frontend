import type { CreditEntry } from '../types'
import { money } from '../../lib/format'
import { saleDateTime } from '../../sales/format'
export function paymentSlipText(entry: CreditEntry) {
  return [
    'CASH REPAYMENT ACKNOWLEDGMENT',
    entry.payment_number ?? '',
    `Customer: ${entry.customer?.name ?? ''}`,
    entry.customer?.phone ?? '',
    `Date: ${saleDateTime.format(new Date(entry.created_at))}`,
    `Cash received: ${money(entry.amount_centavos)}`,
    `Utang before payment: ${money(entry.balance_before_centavos)}`,
    `Utang after payment: ${money(entry.balance_after_centavos)}`,
    `Recorded by: ${entry.recorded_by.name ?? ''}`,
    entry.notes ?? '',
  ].join('\n')
}
