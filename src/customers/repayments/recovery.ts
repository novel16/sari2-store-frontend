import { parseCentavos } from '../../lib/format'
import type { CustomerSelection } from '../types'
import type { RepaymentAttempt } from './types'

export const repaymentStorageKey = (userId: number, storeId: number) =>
  `sarisari:repayment:v1:${userId}:${storeId}`

export function repaymentAmounts(text: string, balance: string) {
  try {
    const amount = parseCentavos(text)
    if (amount < 1)
      return { amount, remaining: balance, error: 'Enter a payment greater than zero.' }
    if (BigInt(amount) > BigInt(balance))
      return { amount, remaining: balance, error: 'Payment cannot exceed the outstanding balance.' }
    return { amount, remaining: (BigInt(balance) - BigInt(amount)).toString(), error: '' }
  } catch {
    return {
      amount: 0,
      remaining: balance,
      error: 'Enter a valid payment up to ₱10,000,000.00 with at most two decimal places.',
    }
  }
}

export function createRepayment(
  customer: CustomerSelection,
  amount: number,
  notes: string,
  key: string,
): RepaymentAttempt {
  return {
    version: 1,
    customer: {
      id: customer.id,
      store_id: customer.store_id,
      name: customer.name,
      phone: customer.phone,
      status: customer.status,
      balance_centavos: customer.balance_centavos,
    },
    input: {
      request_key: key,
      method: 'cash',
      amount_centavos: amount,
      expected_balance_centavos: customer.balance_centavos,
      notes: notes.trim() || null,
    },
  }
}

export function readRepayment(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  storeId: number,
): RepaymentAttempt | null {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null') as RepaymentAttempt | null
    if (!value || value.version !== 1) return null
    const { customer, input } = value
    if (
      !Number.isSafeInteger(customer.id) ||
      customer.id < 1 ||
      customer.store_id !== storeId ||
      typeof customer.name !== 'string' ||
      !customer.name.trim() ||
      customer.name.length > 120 ||
      !(customer.phone === null || typeof customer.phone === 'string') ||
      !['active', 'archived'].includes(customer.status) ||
      typeof customer.balance_centavos !== 'string' ||
      !/^(0|[1-9][0-9]{0,18})$/.test(customer.balance_centavos) ||
      input.expected_balance_centavos !== customer.balance_centavos ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.request_key) ||
      input.method !== 'cash' ||
      !Number.isSafeInteger(input.amount_centavos) ||
      input.amount_centavos < 1 ||
      input.amount_centavos > 1000000000 ||
      BigInt(input.amount_centavos) > BigInt(customer.balance_centavos) ||
      !(input.notes === null || (typeof input.notes === 'string' && input.notes.length <= 255))
    )
      return null
    return value
  } catch {
    return null
  }
}

export function removeRepayment(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  requestKey: string,
) {
  try {
    if (JSON.parse(storage.getItem(key) ?? 'null')?.input?.request_key === requestKey)
      storage.removeItem(key)
  } catch {
    /* A confirmed payment must remain successful even if storage cleanup fails. */
  }
}
