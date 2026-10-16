export interface SaleItem {
  id: number
  product_id: number
  product_name_snapshot: string
  sku_snapshot: string | null
  barcode_snapshot: string | null
  unit_snapshot: string
  quantity: number
  unit_price_centavos: number
  unit_cost_centavos: number
  line_total_centavos: number
}

export interface SaleSummary {
  id: number
  store_id: number
  sale_number: string
  status: 'completed' | 'voided' | 'refunded'
  reversal?: import('./reversals/types').ReversalRecord | null
  completed_at: string
  payment_method: 'cash' | 'credit'
  customer: { id: number; name: string; phone: string | null } | null
  credit_amount_centavos: number
  store: { name: string; address: string | null; phone: string | null }
  sold_by: { id: number; name: string }
  subtotal_centavos: number
  discount_centavos: number
  total_centavos: number
  amount_paid_centavos: number
  items_count: number
  quantity_total: number
  payment: {
    method: 'cash'
    amount_centavos: number
    tendered_centavos: number
    change_centavos: number
  } | null
}

export interface SaleDetail extends SaleSummary {
  items: SaleItem[]
  credit?: { balance_before_centavos: string; balance_after_centavos: string } | null
}

export interface SalesTotals {
  transactions: number
  gross_sales_centavos: string
  discounts_centavos: string
  net_sales_centavos: string
  cash_collected_centavos: string
}

export interface SalesPageResponse {
  data: SaleSummary[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
    summary: SalesTotals
    snapshot_id: number | null
  }
}

export interface CheckoutInput {
  idempotency_key: string
  items: { product_id: number; quantity: number; expected_unit_price_centavos: number }[]
  discount_centavos: number
  payment: { method: 'cash'; tendered_centavos: number } | { method: 'credit'; customer_id: number }
}

export interface CheckoutResult {
  data: SaleDetail
  meta: { replayed: boolean }
}
