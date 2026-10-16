import { downloadCsv } from '../lib/csv'
import { averageSale, decimalPesos } from './money'
import type { SalesReport } from './types'

export function reportRows(report: SalesReport): (string | number)[][] {
  const { summary: s } = report
  return [
    ['Sari-sari Store sales and collections report'],
    ['Store', report.store.name],
    ['Store ID', report.store.id],
    ['Date from', report.date_from],
    ['Date to', report.date_to],
    ['Timezone', report.timezone],
    ['Generated at (UTC)', report.generated_at],
    [],
    ['Sales summary', 'Amount PHP'],
    ['Gross sales before discounts', decimalPesos(s.gross_sales_centavos)],
    ['Discounts', decimalPesos(s.discounts_centavos)],
    ['Sales after discounts', decimalPesos(s.net_sales_centavos)],
    ['Transactions', s.transactions],
    ['Units sold', s.units_sold],
    ['Average sale PHP', decimalPesos(averageSale(s.net_sales_centavos, s.transactions))],
    [],
    ['Sales and collections breakdown', 'Amount PHP'],
    ['Cash sales (excludes change)', decimalPesos(s.cash_sales_centavos)],
    ['Utang sales', decimalPesos(s.credit_sales_centavos)],
    ['Cash utang repayments', decimalPesos(s.repayments_centavos)],
    ['Total cash collected (cash sales + repayments)', decimalPesos(s.cash_collected_centavos)],
    ['Repayment count', s.repayment_count],
    [],
    ['Voids and refunds recorded in this period'],
    ['Reversal count', s.reversal_count ?? 0],
    ['Sales reversed PHP', decimalPesos(s.reversed_sales_centavos ?? '0')],
    ['Cash refunds PHP', decimalPesos(s.cash_refunds_centavos ?? '0')],
    [
      'Net sales after reversals PHP',
      decimalPesos(s.net_after_reversals_centavos ?? s.net_sales_centavos),
    ],
    [
      'Net cash collected PHP',
      decimalPesos(s.net_cash_collected_centavos ?? s.cash_collected_centavos),
    ],
    [],
    ['Daily figures (Asia/Manila)'],
    [
      'Date',
      'Transactions',
      'Units sold',
      'Gross sales PHP',
      'Discounts PHP',
      'Sales after discounts PHP',
      'Cash sales PHP',
      'Utang sales PHP',
      'Repayment count',
      'Cash utang repayments PHP',
      'Total cash collected PHP',
      'Reversal count',
      'Sales reversed PHP',
      'Cash refunds PHP',
      'Net sales after reversals PHP',
      'Net cash collected PHP',
    ],
    ...report.days.map((day) => [
      day.date,
      day.transactions,
      day.units_sold,
      decimalPesos(day.gross_sales_centavos),
      decimalPesos(day.discounts_centavos),
      decimalPesos(day.net_sales_centavos),
      decimalPesos(day.cash_sales_centavos),
      decimalPesos(day.credit_sales_centavos),
      day.repayment_count,
      decimalPesos(day.repayments_centavos),
      decimalPesos(day.cash_collected_centavos),
      day.reversal_count ?? 0,
      decimalPesos(day.reversed_sales_centavos ?? '0'),
      decimalPesos(day.cash_refunds_centavos ?? '0'),
      decimalPesos(day.net_after_reversals_centavos ?? day.net_sales_centavos),
      decimalPesos(day.net_cash_collected_centavos ?? day.cash_collected_centavos),
    ]),
    [],
    [`Top ${report.top_products_limit} products by units sold`],
    ['Rank', 'Product', 'Unit', 'Units sold', 'Sales before order discounts PHP'],
    ...report.top_products.map((product, i) => [
      i + 1,
      product.name,
      product.unit,
      product.units_sold,
      decimalPesos(product.gross_sales_centavos),
    ]),
    [],
    ['Repayments are collections of existing debt and do not add another sale.'],
    [
      'Reversals are offsets on the date they were recorded. Original sales and units remain on their checkout dates.',
    ],
    [
      'Product sales use saved prices before order discounts; they are not allocated net sales or profit.',
    ],
  ]
}

export function exportReport(report: SalesReport) {
  downloadCsv(
    `sarisari-report-${report.store.id}-${report.date_from}-to-${report.date_to}.csv`,
    reportRows(report),
  )
}
