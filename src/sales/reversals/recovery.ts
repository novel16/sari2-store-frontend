import type { ReversalAttempt } from './types'

export const reversalStorageKey = (user: number, store: number) =>
  `sarisari:reversal:v1:${user}:${store}`
export function readReversal(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  storeId: number,
): ReversalAttempt | null {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null')
    const input = value?.input
    if (
      !value ||
      value.version !== 1 ||
      value.store_id !== storeId ||
      !Number.isSafeInteger(value.sale_id) ||
      value.sale_id < 1 ||
      typeof value.sale_number !== 'string' ||
      value.sale_number.length > 80
    )
      return null
    if (
      !input ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.request_key) ||
      !['void', 'refund'].includes(input.kind) ||
      typeof input.reason !== 'string' ||
      input.reason.trim().length < 3 ||
      input.reason.length > 255 ||
      typeof input.restock !== 'boolean' ||
      typeof input.cash_confirmed !== 'boolean'
    )
      return null
    if (
      input.expected_balance_centavos !== null &&
      (typeof input.expected_balance_centavos !== 'string' ||
        !/^(0|[1-9][0-9]{0,18})$/.test(input.expected_balance_centavos))
    )
      return null
    return {
      version: 1,
      store_id: storeId,
      sale_id: value.sale_id,
      sale_number: value.sale_number,
      input: {
        request_key: input.request_key,
        kind: input.kind,
        reason: input.reason,
        restock: input.restock,
        cash_confirmed: input.cash_confirmed,
        expected_balance_centavos: input.expected_balance_centavos,
      },
    }
  } catch {
    return null
  }
}
export function removeReversal(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  requestKey: string,
) {
  try {
    if (JSON.parse(storage.getItem(key) ?? 'null')?.input?.request_key === requestKey)
      storage.removeItem(key)
  } catch {
    /* Keep unrelated/corrupt records untouched. */
  }
}
