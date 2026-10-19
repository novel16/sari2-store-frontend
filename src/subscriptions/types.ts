import type { PaymentOrder } from './payments/types'

export interface PlanTerms {
  code: string
  name: string
  monthly_price_centavos: number
  active_product_limit: number | null
  quota_scope: 'store' | 'account'
  store_limit: number
  staff_limit: number
  ads_enabled: boolean
}
export interface Plan extends Omit<PlanTerms, 'ads_enabled'> {
  id: number
  version: number
  description: string | null
  catalog_status: 'published' | 'coming_soon'
  featured: boolean
  sort_order: number
  planned_features: string[]
}
export interface SubscriptionReply {
  data: {
    account_id: number
    current: {
      plan: PlanTerms
      status: 'active' | 'free_fallback'
      subscription_id: number | null
      starts_at: string | null
      ends_at: string | null
      saved_terms: boolean
    }
    usage: {
      active_products: number
      active_product_limit: number | null
      quota_scope: 'store' | 'account'
      remaining: number | null
      over_limit: boolean
      stores: number
      staff: number
    }
    plans: Plan[]
    billing_available: boolean
    pending_order?: PaymentOrder | null
    manual_activation_available: boolean
    renewal: {
      mode: 'manual'
      auto_renew: false
      next_period: {
        id: number
        plan: PlanTerms
        starts_at: string
        ends_at: string | null
      } | null
      scheduled_periods: number
      last_paid_ended_at: string | null
    }
  }
}
