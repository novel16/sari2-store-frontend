import type { CashAttempt, CashTotals, CloseReview, NewCashAttempt } from './types'

type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export const cashStorageKey = (userId: number, storeId: number) =>
  'sarisari:cash:v1:' + userId + ':' + storeId
export const cashRecoveryMessage =
  'Cash recovery data is unavailable. Allow session storage and reload before recording cash changes.'
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const integer = /^-?(0|[1-9][0-9]{0,24})$/
const date = /^\d{4}-\d{2}-\d{2}$/
const amount = (value: unknown, minimum = 0): value is number =>
  Number.isSafeInteger(value) && Number(value) >= minimum && Number(value) <= 1e9
const id = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0
const notes = (value: unknown) =>
  value === null || (typeof value === 'string' && value.length <= 500)

function readTotals(value: CashTotals): CashTotals {
  const moneyKeys = [
    'opening_cash_centavos',
    'cash_sales_centavos',
    'repayments_centavos',
    'cash_refunds_centavos',
    'cash_in_centavos',
    'cash_out_centavos',
    'expected_cash_centavos',
  ] as const
  const countKeys = [
    'cash_sale_count',
    'repayment_count',
    'cash_refund_count',
    'movement_count',
  ] as const
  for (const key of moneyKeys)
    if (typeof value[key] !== 'string' || !integer.test(value[key]))
      throw new Error(cashRecoveryMessage)
  for (const key of countKeys)
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) throw new Error(cashRecoveryMessage)
  return Object.fromEntries(
    [...moneyKeys, ...countKeys].map((key) => [key, value[key]]),
  ) as unknown as CashTotals
}

export function copyCloseReview(value: CloseReview, storeId: number): CloseReview {
  if (
    !id(value.cash_day_id) ||
    value.store_id !== storeId ||
    !date.test(value.business_date) ||
    !amount(Number(value.counted_cash_centavos)) ||
    typeof value.counted_cash_centavos !== 'string' ||
    !integer.test(value.counted_cash_centavos) ||
    typeof value.variance_centavos !== 'string' ||
    !integer.test(value.variance_centavos) ||
    !notes(value.notes) ||
    typeof value.review_token !== 'string' ||
    !value.review_token ||
    value.review_token.length > 20000 ||
    !Number.isFinite(Date.parse(value.expires_at))
  )
    throw new Error(cashRecoveryMessage)
  const totals = readTotals(value.totals)
  if (
    (BigInt(value.counted_cash_centavos) - BigInt(totals.expected_cash_centavos)).toString() !==
    value.variance_centavos
  )
    throw new Error(cashRecoveryMessage)
  return {
    cash_day_id: value.cash_day_id,
    store_id: storeId,
    business_date: value.business_date,
    totals,
    counted_cash_centavos: value.counted_cash_centavos,
    variance_centavos: value.variance_centavos,
    notes: value.notes,
    review_token: value.review_token,
    expires_at: value.expires_at,
  }
}

export function createCashAttempt(
  userId: number,
  storeId: number,
  value: NewCashAttempt,
  key: string,
): CashAttempt {
  const base = { version: 1 as const, user_id: userId, store_id: storeId }
  if (value.kind === 'open')
    return {
      ...base,
      kind: 'open',
      business_date: value.business_date,
      input: {
        request_key: key,
        business_date: value.business_date,
        opening_cash_centavos: value.opening_cash_centavos,
        notes: value.notes,
      },
    }
  if (value.kind === 'movement')
    return {
      ...base,
      kind: 'movement',
      business_date: value.day.business_date,
      day_id: value.day.id,
      input: {
        request_key: key,
        direction: value.direction,
        amount_centavos: value.amount_centavos,
        reason: value.reason.trim(),
      },
    }
  const review = copyCloseReview(value.review, storeId)
  return {
    ...base,
    kind: 'close',
    business_date: review.business_date,
    day_id: review.cash_day_id,
    review,
    input: { request_key: key, review_token: review.review_token },
  }
}

export function readCashAttempt(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  userId: number,
  storeId: number,
): CashAttempt | null {
  const raw = storage.getItem(key)
  if (raw === null) return null
  try {
    const value = JSON.parse(raw) as CashAttempt
    if (
      value.version !== 1 ||
      value.user_id !== userId ||
      value.store_id !== storeId ||
      !date.test(value.business_date) ||
      !uuid.test(value.input.request_key)
    )
      throw new Error()
    if (value.kind === 'open') {
      if (
        value.input.business_date !== value.business_date ||
        !amount(value.input.opening_cash_centavos) ||
        !notes(value.input.notes)
      )
        throw new Error()
      return createCashAttempt(
        userId,
        storeId,
        {
          kind: 'open',
          business_date: value.business_date,
          opening_cash_centavos: value.input.opening_cash_centavos,
          notes: value.input.notes,
        },
        value.input.request_key,
      )
    }
    if (!id(value.day_id)) throw new Error()
    if (value.kind === 'movement') {
      if (
        !['in', 'out'].includes(value.input.direction) ||
        !amount(value.input.amount_centavos, 1) ||
        typeof value.input.reason !== 'string' ||
        value.input.reason.trim().length < 3 ||
        value.input.reason.length > 255
      )
        throw new Error()
      return {
        version: 1,
        kind: 'movement',
        user_id: userId,
        store_id: storeId,
        business_date: value.business_date,
        day_id: value.day_id,
        input: {
          request_key: value.input.request_key,
          direction: value.input.direction,
          amount_centavos: value.input.amount_centavos,
          reason: value.input.reason.trim(),
        },
      }
    }
    if (value.kind !== 'close') throw new Error()
    const review = copyCloseReview(value.review, storeId)
    if (
      value.day_id !== review.cash_day_id ||
      value.business_date !== review.business_date ||
      value.input.review_token !== review.review_token
    )
      throw new Error()
    return createCashAttempt(userId, storeId, { kind: 'close', review }, value.input.request_key)
  } catch {
    throw new Error(cashRecoveryMessage)
  }
}

export function persistCashAttempt(storage: RecoveryStorage, key: string, value: CashAttempt) {
  const normalized = readCashAttempt(
    { getItem: () => JSON.stringify(value) },
    key,
    value.user_id,
    value.store_id,
  )!
  const existing = readCashAttempt(storage, key, value.user_id, value.store_id)
  if (existing && JSON.stringify(existing) !== JSON.stringify(normalized))
    throw new Error('Confirm the pending cash change before starting another.')
  storage.setItem(key, JSON.stringify(normalized))
}

export function removeCashAttempt(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  requestKey: string,
) {
  const raw = storage.getItem(key)
  if (raw !== null && JSON.parse(raw)?.input?.request_key === requestKey) storage.removeItem(key)
}
