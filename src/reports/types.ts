export interface ReportRange {
  date_from: string
  date_to: string
}

export type ReportPreset = 'today' | 'this_week' | 'this_month' | 'custom'

export interface ReportTotals {
  reversal_count: number
  reversed_sales_centavos: string
  cash_refunds_centavos: string
  net_after_reversals_centavos: string
  net_cash_collected_centavos: string
  transactions: number
  repayment_count: number
  units_sold: string
  gross_sales_centavos: string
  discounts_centavos: string
  net_sales_centavos: string
  cash_sales_centavos: string
  credit_sales_centavos: string
  repayments_centavos: string
  cash_collected_centavos: string
}

export interface ReportDay extends ReportTotals {
  date: string
}

export interface SalesReport extends ReportRange {
  store: { id: number; name: string }
  timezone: 'Asia/Manila'
  generated_at: string
  summary: ReportTotals
  days: ReportDay[]
  top_products_limit: number
  top_products: {
    product_id: number
    name: string
    unit: string
    units_sold: string
    gross_sales_centavos: string
  }[]
}

export interface ReportReply {
  data: SalesReport
}
