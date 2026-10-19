import { isOrderId } from './checkout'
import type { PurchaseInput } from './types'

export const purchaseStorageKey = (userId: number, storeId: number) =>
  `sarisari:subscription-order:v1:${userId}:${storeId}`
export function readPurchase(storage: Pick<Storage, 'getItem'>, key: string): PurchaseInput | null {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null') as PurchaseInput | null
    if (
      !value ||
      !isOrderId(value.request_key) ||
      !Number.isSafeInteger(value.plan_id) ||
      value.plan_id < 1 ||
      !Number.isSafeInteger(value.expected_plan_version) ||
      value.expected_plan_version < 1 ||
      !Number.isSafeInteger(value.months) ||
      value.months < 1 ||
      value.months > 12
    )
      return null
    return {
      request_key: value.request_key,
      plan_id: value.plan_id,
      expected_plan_version: value.expected_plan_version,
      months: value.months,
    }
  } catch {
    return null
  }
}
