export interface CashActor {
  id: number
  name: string
}

export interface CashTotals {
  opening_cash_centavos: string
  cash_sales_centavos: string
  repayments_centavos: string
  cash_refunds_centavos: string
  cash_in_centavos: string
  cash_out_centavos: string
  expected_cash_centavos: string
  cash_sale_count: number
  repayment_count: number
  cash_refund_count: number
  movement_count: number
}

export interface CashDay {
  id: number
  store_id: number
  business_date: string
  status: 'open' | 'closed'
  opening_cash_centavos: string
  notes: string | null
  opened_at: string
  opened_by: CashActor
  closed_at: string | null
  closed_by: CashActor | null
  closing: null | {
    totals: CashTotals
    counted_cash_centavos: string
    variance_centavos: string
    notes: string | null
  }
}

export interface CashMovement {
  id: number
  cash_day_id: number
  store_id: number
  direction: 'in' | 'out'
  amount_centavos: string
  reason: string
  actor: CashActor
  created_at: string
}

export interface CloseReview {
  cash_day_id: number
  store_id: number
  business_date: string
  totals: CashTotals
  counted_cash_centavos: string
  variance_centavos: string
  notes: string | null
  review_token: string
  expires_at: string
}

export interface CashDayResult {
  data: CashDay
  totals: CashTotals
  meta?: { replayed: boolean }
}

export interface CurrentCashDay {
  data: CashDay | null
  business_date: string
  time_zone: string
  totals: CashTotals | null
}

export interface CashMovementResult {
  data: CashMovement
  day: CashDay
  totals: CashTotals
  meta?: { replayed: boolean }
}

export interface CashPage<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

interface AttemptBase {
  version: 1
  user_id: number
  store_id: number
  business_date: string
}

export type CashAttempt =
  | (AttemptBase & {
      kind: 'open'
      input: {
        request_key: string
        business_date: string
        opening_cash_centavos: number
        notes: string | null
      }
    })
  | (AttemptBase & {
      kind: 'movement'
      day_id: number
      input: {
        request_key: string
        direction: 'in' | 'out'
        amount_centavos: number
        reason: string
      }
    })
  | (AttemptBase & {
      kind: 'close'
      day_id: number
      review: CloseReview
      input: { request_key: string; review_token: string }
    })

export type NewCashAttempt =
  | { kind: 'open'; business_date: string; opening_cash_centavos: number; notes: string | null }
  | {
      kind: 'movement'
      day: CashDay
      direction: 'in' | 'out'
      amount_centavos: number
      reason: string
    }
  | { kind: 'close'; review: CloseReview }

export type CashResult = CashDayResult | CashMovementResult
