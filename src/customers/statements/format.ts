import { money } from '../../lib/format'
import { saleDateTime } from '../../sales/format'
import type { CreditEntry } from '../types'
import type { CustomerStatement } from './types'

export const decreasesBalance = (entry: CreditEntry) =>
  entry.entry_type === 'payment' || entry.entry_type === 'reversal'
export const entryLabel = (entry: CreditEntry) =>
  ({
    charge: 'Utang sale',
    payment: 'Cash repayment',
    reversal: 'Sale reversal',
    opening_balance: 'Opening utang',
  })[entry.entry_type]
export const entryReference = (entry: CreditEntry) =>
  entry.payment_number ??
  entry.opening_number ??
  entry.reversal?.reference ??
  entry.sale_number ??
  `Entry #${entry.id}`
export function statementRows(statement: CustomerStatement): (string | number)[][] {
  const decimal = (amount: string | number) => {
    const value = BigInt(amount)
    return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`
  }
  return [
    ['Customer statement', statement.customer.name],
    ['Store', statement.store.name],
    ['Generated (Manila)', saleDateTime.format(new Date(statement.generated_at))],
    ['Through entry', statement.snapshot_id],
    ['Opening utang PHP', decimal(statement.totals.opening_centavos)],
    ['Utang sales PHP', decimal(statement.totals.charges_centavos)],
    ['Cash repayments PHP', decimal(statement.totals.payments_centavos)],
    ['Debt reversed PHP', decimal(statement.totals.reversals_centavos)],
    ['Outstanding PHP', decimal(statement.customer.balance_centavos)],
    [],
    [
      'Date (Manila)',
      'Type',
      'Reference',
      'Increase PHP',
      'Decrease PHP',
      'Balance after PHP',
      'Recorded by',
      'Notes',
    ],
    ...statement.data.map((entry) => [
      saleDateTime.format(new Date(entry.created_at)),
      entryLabel(entry),
      entryReference(entry),
      decreasesBalance(entry) ? '0.00' : decimal(entry.amount_centavos),
      decreasesBalance(entry) ? decimal(entry.amount_centavos) : '0.00',
      decimal(entry.balance_after_centavos),
      entry.recorded_by.name ?? '',
      entry.notes ?? '',
    ]),
  ]
}
export function statementText(statement: CustomerStatement) {
  return [
    statement.store.name,
    'CUSTOMER UTANG STATEMENT',
    statement.customer.name,
    statement.customer.phone ?? '',
    `Generated: ${saleDateTime.format(new Date(statement.generated_at))}`,
    `Through entry: ${statement.snapshot_id}`,
    '',
    ...statement.data.map(
      (entry) =>
        `${saleDateTime.format(new Date(entry.created_at))} | ${entryLabel(entry)} | ${entryReference(entry)} | ${decreasesBalance(entry) ? '-' : '+'}${money(entry.amount_centavos)} | Balance: ${money(entry.balance_after_centavos)} | ${entry.recorded_by.name ?? ''}${entry.notes ? ` | ${entry.notes}` : ''}`,
    ),
    '',
    `Opening utang: ${money(statement.totals.opening_centavos)}`,
    `Utang sales: ${money(statement.totals.charges_centavos)}`,
    `Cash repayments: ${money(statement.totals.payments_centavos)}`,
    `Debt reversed: ${money(statement.totals.reversals_centavos)}`,
    `OUTSTANDING: ${money(statement.customer.balance_centavos)}`,
  ].join('\n')
}
