import { http } from '../../api/http'
import { storePath } from '../../catalog/api'
import { downloadCsv } from '../../lib/csv'
import { saleDateTime } from '../../sales/format'
import type { SalesPageResponse } from '../../sales/types'

export async function exportSales(storeId: number, filters: URLSearchParams) {
  const query = new URLSearchParams(filters)
  query.set('per_page', '100')
  const rows: (string | number)[][] = [
    [
      'Sale number',
      'Date (Manila)',
      'Sold by',
      'Payment method',
      'Customer',
      'Utang PHP',
      'Quantity',
      'Subtotal PHP',
      'Discount PHP',
      'Total PHP',
      'Cash received PHP',
      'Change PHP',
      'Status',
      'Reversal reference',
      'Reversal date (Manila)',
      'Reversal reason',
      'Cash refunded PHP',
      'Utang reduced PHP',
      'Restocked',
    ],
  ]
  let page = 1
  let last: number
  do {
    query.set('page', String(page))
    const { data } = await http.get<SalesPageResponse>(`${storePath(storeId)}/sales?${query}`)
    if (data.meta.snapshot_id) query.set('through_id', String(data.meta.snapshot_id))
    for (const sale of data.data)
      rows.push([
        sale.sale_number,
        saleDateTime.format(new Date(sale.completed_at)),
        sale.sold_by.name,
        sale.payment_method === 'credit' ? 'Utang' : 'Cash',
        sale.customer?.name ?? '',
        (sale.credit_amount_centavos / 100).toFixed(2),
        sale.quantity_total,
        (sale.subtotal_centavos / 100).toFixed(2),
        (sale.discount_centavos / 100).toFixed(2),
        (sale.total_centavos / 100).toFixed(2),
        ((sale.payment?.tendered_centavos ?? 0) / 100).toFixed(2),
        ((sale.payment?.change_centavos ?? 0) / 100).toFixed(2),
        sale.status,
        sale.reversal?.reference ?? '',
        sale.reversal ? saleDateTime.format(new Date(sale.reversal.created_at)) : '',
        sale.reversal?.reason ?? '',
        ((sale.reversal?.cash_refund_centavos ?? 0) / 100).toFixed(2),
        ((sale.reversal?.credit_reversed_centavos ?? 0) / 100).toFixed(2),
        sale.reversal ? (sale.reversal.restock ? 'Yes' : 'No') : '',
      ])
    last = data.meta.last_page
    page += 1
  } while (page <= last)
  downloadCsv('sarisari-sales.csv', rows)
}
