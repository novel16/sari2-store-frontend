export interface PaymentOrder {
  id: string
  account_id: number
  plan: { id: number; version: number; code: string; name: string }
  months: number
  amount_centavos: number
  currency: 'PHP'
  payment_status: 'creating' | 'pending' | 'unknown' | 'paid' | 'expired' | 'failed'
  fulfillment_status: 'pending' | 'fulfilled' | 'needs_attention'
  checkout_url: string | null
  can_resume: boolean
  can_cancel: boolean
  expires_at: string | null
  paid_at: string | null
  fulfilled_at: string | null
  created_at: string
  issue_code: string | null
  subscription: { id: number; starts_at: string; ends_at: string | null } | null
}
export interface PurchaseInput {
  request_key: string
  plan_id: number
  expected_plan_version: number
  months: number
}
export interface OrderReply {
  data: PaymentOrder
}
export interface PaymentHistory {
  data: PaymentOrder[]
  meta: {
    current_page: number
    last_page: number
    total: number
    from: number | null
    to: number | null
  }
}
