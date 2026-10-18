import type { AdjustmentInput, Product } from '../catalog/types'

export interface StockAdjustmentAttempt {
  version: 1
  store_id: number
  product: Pick<Product, 'id' | 'name' | 'unit'>
  input: AdjustmentInput
}

type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const stockAdjustmentStorageKey = (userId: number, storeId: number) =>
  'sarisari:stock-adjustment:v1:' + userId + ':' + storeId

export const stockRecoveryMessage =
  'Stock recovery data is unavailable. Allow browser session storage and reload before adjusting stock.'

export function createStockAdjustment(
  storeId: number,
  product: Pick<Product, 'id' | 'name' | 'unit'>,
  input: Omit<AdjustmentInput, 'request_key'>,
  requestKey: string,
): StockAdjustmentAttempt {
  return {
    version: 1,
    store_id: storeId,
    product: { id: product.id, name: product.name, unit: product.unit },
    input: { ...input, reason: input.reason.trim(), request_key: requestKey },
  }
}

// Malformed or inaccessible storage must block a new write, rather than silently
// discard the only identity of an adjustment that may have already committed.
export function readStockAdjustment(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  storeId: number,
): StockAdjustmentAttempt | null {
  const raw = storage.getItem(key)
  if (raw === null) return null
  try {
    const value = JSON.parse(raw) as StockAdjustmentAttempt
    const { product, input } = value
    if (
      value.version !== 1 ||
      value.store_id !== storeId ||
      !Number.isSafeInteger(product.id) || product.id < 1 ||
      typeof product.name !== 'string' || !product.name.trim() || product.name.length > 120 ||
      typeof product.unit !== 'string' || !product.unit || product.unit.length > 32 ||
      input.product_id !== product.id ||
      !['add', 'remove', 'set'].includes(input.mode) ||
      !Number.isSafeInteger(input.quantity) || input.quantity < 0 || input.quantity > 1000000000 ||
      (input.mode !== 'set' && input.quantity === 0) ||
      typeof input.reason !== 'string' || !input.reason.trim() || input.reason.length > 255 ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.request_key) ||
      (input.mode === 'set' &&
        (!Number.isSafeInteger(input.expected_version) || (input.expected_version ?? -1) < 0 ||
          (input.expected_version ?? 0) > 4294967294)) ||
      (input.mode !== 'set' && input.expected_version !== undefined)
    ) throw new Error(stockRecoveryMessage)
    // Copy only the supported fields; browser storage is never a trusted API payload.
    return createStockAdjustment(storeId, product, {
      product_id: input.product_id,
      mode: input.mode,
      quantity: input.quantity,
      reason: input.reason,
      ...(input.mode === 'set' ? { expected_version: input.expected_version } : {}),
    }, input.request_key)
  } catch {
    throw new Error(stockRecoveryMessage)
  }
}

export function persistStockAdjustment(
  storage: RecoveryStorage,
  key: string,
  attempt: StockAdjustmentAttempt,
) {
  const existing = readStockAdjustment(storage, key, attempt.store_id)
  if (existing && JSON.stringify(existing) !== JSON.stringify(attempt))
    throw new Error('Confirm the pending stock adjustment before starting another.')
  storage.setItem(key, JSON.stringify(attempt))
}

export function removeStockAdjustment(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  requestKey: string,
) {
  const raw = storage.getItem(key)
  if (raw === null) return
  if (JSON.parse(raw)?.input?.request_key === requestKey) storage.removeItem(key)
}
