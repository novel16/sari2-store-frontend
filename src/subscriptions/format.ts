import type { PlanTerms } from './types'
export const subscriptionPath = (storeId: number) => `/api/v1/stores/${storeId}/subscription`
export function productAllowance(plan: Pick<PlanTerms, 'active_product_limit' | 'quota_scope'>) {
  return `${plan.active_product_limit === null ? 'Unlimited' : plan.active_product_limit.toLocaleString('en-PH')} active products${plan.quota_scope === 'account' ? ' across all stores' : ' per store'}`
}
export function usagePercent(used: number, limit: number | null) {
  return limit === null ? 0 : Math.min(100, Math.max(0, (used / Math.max(1, limit)) * 100))
}
export function ownerAccess(plan: Pick<PlanTerms, 'store_limit' | 'staff_limit'>) {
  return `${plan.store_limit} ${plan.store_limit === 1 ? 'store' : 'stores'} · ${plan.staff_limit ? `owner + ${plan.staff_limit} staff` : 'owner only'}`
}
export const coreFeatures = [
  'Cash & utang POS',
  'Inventory and barcode scanning',
  'Customer ledger & repayments',
  'Sales reports and CSV export',
]
