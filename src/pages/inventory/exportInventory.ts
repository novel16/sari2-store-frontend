import { http } from '../../api/http'
import { storePath } from '../../catalog/api'
import type { PageResponse, Product } from '../../catalog/types'
import { downloadCsv } from '../../lib/csv'

export async function exportInventory(storeId: number, filters: URLSearchParams) {
  const query = new URLSearchParams(filters)
  query.set('per_page', '100')
  const rows: (string | number)[][] = [
    ['Product', 'Category', 'SKU', 'Barcode', 'On hand', 'Unit', 'Reorder level', 'Cost PHP'],
  ]
  let page = 1
  let last: number
  do {
    query.set('page', String(page))
    const { data } = await http.get<PageResponse<Product>>(
      `${storePath(storeId)}/inventory?${query}`,
    )
    for (const product of data.data)
      rows.push([
        product.name,
        product.category?.name ?? '',
        product.sku ?? '',
        product.barcode ?? '',
        product.inventory.quantity_on_hand,
        product.unit,
        product.low_stock_threshold,
        (product.cost_centavos / 100).toFixed(2),
      ])
    last = data.meta.last_page
    page += 1
  } while (page <= last)
  downloadCsv('sarisari-inventory.csv', rows)
}
