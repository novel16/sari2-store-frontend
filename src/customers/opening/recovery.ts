export interface OpeningAttempt {
  version: 1
  store_id: number
  customer_id: number
  customer_name: string
  input: { request_key: string; amount_centavos: number; notes: string }
}
export const openingStorageKey = (userId: number, storeId: number) =>
  `sarisari:opening:v1:${userId}:${storeId}`
export function readOpening(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  storeId: number,
): OpeningAttempt | null {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null') as OpeningAttempt | null
    if (
      !value ||
      value.version !== 1 ||
      value.store_id !== storeId ||
      !Number.isSafeInteger(value.customer_id) ||
      value.customer_id < 1 ||
      typeof value.customer_name !== 'string' ||
      !value.customer_name.trim() ||
      value.customer_name.length > 120 ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        value.input.request_key,
      ) ||
      !Number.isSafeInteger(value.input.amount_centavos) ||
      value.input.amount_centavos < 1 ||
      value.input.amount_centavos > 1e9 ||
      typeof value.input.notes !== 'string' ||
      value.input.notes.trim().length < 3 ||
      value.input.notes.length > 255
    )
      return null
    return {
      version: 1,
      store_id: storeId,
      customer_id: value.customer_id,
      customer_name: value.customer_name,
      input: {
        request_key: value.input.request_key,
        amount_centavos: value.input.amount_centavos,
        notes: value.input.notes,
      },
    }
  } catch {
    return null
  }
}
export function removeOpening(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  requestKey: string,
) {
  try {
    if (JSON.parse(storage.getItem(key) ?? 'null')?.input?.request_key === requestKey)
      storage.removeItem(key)
  } catch {
    /* Saved ledger remains available. */
  }
}
