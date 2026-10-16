import type { SaleSummary } from '../sales/types'

export type DashboardPeriod = 'this_week' | 'last_week' | 'this_month'

export interface DashboardDay {
  date: string
  net_sales_centavos: string
  transactions: number
}

export interface DashboardData {
  timezone: 'Asia/Manila'
  business_date: string
  generated_at: string
  today: {
    reversal_count: number
    reversed_sales_centavos: string
    cash_refunds_centavos: string
    net_after_reversals_centavos: string
    net_cash_collected_centavos: string
    transactions: number
    gross_sales_centavos: string
    discounts_centavos: string
    net_sales_centavos: string
    cash_sales_centavos: string
    credit_sales_centavos: string
    repayments_centavos: string
    cash_collected_centavos: string
  }
  credit: {
    outstanding_centavos: string
    customers_with_balance: number
    archived_with_balance: number
  }
  stock: {
    active_products: number
    in_stock: number
    low_stock: number
    out_of_stock: number
    alerts: {
      id: number
      name: string
      unit: string
      emoji: string
      color: string
      quantity_on_hand: number
      low_stock_threshold: number
    }[]
  }
  chart: {
    period: DashboardPeriod
    date_from: string
    date_to: string
    days: DashboardDay[]
  }
  top_products: { product_id: number; name: string; unit: string; units_sold: string }[]
  recent_sales: SaleSummary[]
}

export interface DashboardReply {
  data: DashboardData
}
