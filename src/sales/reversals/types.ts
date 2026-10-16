import type { SaleDetail } from '../types'

export interface ReversalQuote {
  sale_id: number
  sale_number: string
  total_centavos: number
  cash_refund_centavos: number
  credit_reversed_centavos: number
  balance_before_centavos: string | null
  balance_after_centavos: string | null
  customer: { name: string } | null
  items: { product_id: number; name: string; quantity: number }[]
}
export interface ReversalInput {
  request_key: string
  kind: 'void' | 'refund'
  reason: string
  restock: boolean
  expected_balance_centavos: string | null
  cash_confirmed: boolean
}
export interface ReversalRecord {
  id: number
  sale_id: number
  reference: string
  kind: 'void' | 'refund'
  reason: string
  restock: boolean
  total_centavos: number
  cash_refund_centavos: number
  credit_reversed_centavos: number
  balance_before_centavos: string | null
  balance_after_centavos: string | null
  recorded_by: { id: number; name: string }
  created_at: string
}
export interface ReversalReply {
  data: SaleDetail
  reversal: ReversalRecord
  meta: { replayed: boolean }
}
export interface ReversalAttempt {
  version: 1
  store_id: number
  sale_id: number
  sale_number: string
  input: ReversalInput
}
