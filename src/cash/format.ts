import { money, parseCentavos } from '../lib/format'
import { decimalPesos } from '../reports/money'
import { downloadCsv } from '../lib/csv'
import type { CashDay, CashTotals } from './types'

export function cashAmount(text: string, allowZero = true) {
  const amount = parseCentavos(text.trim())
  if (!allowZero && amount === 0) throw new Error('Enter an amount greater than zero.')
  return amount
}

export const cashInput = decimalPesos

export const cashVariance = (counted: string, expected: string) =>
  (BigInt(counted) - BigInt(expected)).toString()

export function varianceText(value: string) {
  const amount = BigInt(value)
  return amount === 0n
    ? 'Balanced'
    : (amount < 0n ? 'Short by ' : 'Over by ') + money((amount < 0n ? -amount : amount).toString())
}

export const cashDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))

export const totalRows: [keyof CashTotals, string][] = [
  ['opening_cash_centavos', 'Opening cash'],
  ['cash_sales_centavos', 'Cash sales'],
  ['repayments_centavos', 'Cash utang payments'],
  ['cash_refunds_centavos', 'Cash refunds'],
  ['cash_in_centavos', 'Manual cash in'],
  ['cash_out_centavos', 'Manual cash out'],
  ['expected_cash_centavos', 'Expected cash'],
]

export function exportCashClosing(day: CashDay, totals: CashTotals) {
  const rows: (string | number)[][] = [
    ['Business date', day.business_date],
    ['Status', day.status],
    ['Opened by', day.opened_by.name],
    ['Opened at', cashDateTime(day.opened_at)],
    ...totalRows.map(([key, label]) => [label + ' (PHP)', decimalPesos(String(totals[key]))]),
  ]
  if (day.closing)
    rows.push(
      ['Counted cash (PHP)', decimalPesos(day.closing.counted_cash_centavos)],
      ['Variance (PHP)', decimalPesos(day.closing.variance_centavos)],
      ['Closing notes', day.closing.notes ?? ''],
      ['Closed by', day.closed_by?.name ?? ''],
      ['Closed at', day.closed_at ? cashDateTime(day.closed_at) : ''],
    )
  downloadCsv('cash-closing-' + day.business_date + '-' + day.id + '.csv', rows)
}
