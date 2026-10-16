import { money } from '../lib/format'
import { saleDateTime } from './format'
import type { SaleDetail } from './types'

export function summaryText(sale: SaleDetail): string {
  return [
    sale.store.name,
    sale.store.address,
    sale.store.phone,
    'SALES SUMMARY',
    sale.sale_number,
    ...(sale.reversal
      ? [
          `${sale.status.toUpperCase()} · ${sale.reversal.reference}`,
          `Reason: ${sale.reversal.reason}`,
          `Cash refunded: ${money(sale.reversal.cash_refund_centavos)}`,
          `Utang reduced: ${money(sale.reversal.credit_reversed_centavos)}`,
          `${sale.reversal.restock ? 'Stock returned' : 'No restock'} · ${sale.reversal.recorded_by.name}`,
          `Reversed: ${saleDateTime.format(new Date(sale.reversal.created_at))}`,
          'Original sale details:',
        ]
      : []),
    saleDateTime.format(new Date(sale.completed_at)),
    `Sold by: ${sale.sold_by.name}`,
    `Payment: ${sale.payment_method === 'credit' ? 'Utang' : 'Cash'}`,
    ...(sale.customer ? [`Customer: ${sale.customer.name}`, sale.customer.phone] : []),
    '',
    ...sale.items.map(
      (item) =>
        `${item.quantity} × ${item.product_name_snapshot} (${money(item.unit_price_centavos)} / ${item.unit_snapshot})  ${money(item.line_total_centavos)}`,
    ),
    '',
    `Subtotal: ${money(sale.subtotal_centavos)}`,
    `Discount: ${money(sale.discount_centavos)}`,
    `TOTAL: ${money(sale.total_centavos)}`,
    ...(sale.payment
      ? [
          `Cash received: ${money(sale.payment.tendered_centavos)}`,
          `Change: ${money(sale.payment.change_centavos)}`,
        ]
      : [
          `Added to utang: ${money(sale.credit_amount_centavos)}`,
          ...(sale.credit
            ? [`Balance after this sale: ${money(sale.credit.balance_after_centavos)}`]
            : []),
        ]),
  ]
    .filter((line) => line !== null)
    .join('\n')
}

export function downloadSummary(sale: SaleDetail) {
  const url = URL.createObjectURL(
    new Blob([summaryText(sale)], { type: 'text/plain;charset=utf-8' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${sale.sale_number}.txt`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
