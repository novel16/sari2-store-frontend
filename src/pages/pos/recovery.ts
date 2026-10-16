import type { CheckoutAttempt, CartLine } from './types'
import type { CustomerSelection } from '../../customers/types'

export const checkoutStorageKey = (userId: number, storeId: number) =>
  `sarisari:checkout:v1:${userId}:${storeId}`
type StorageReader = Pick<Storage, 'getItem'>

export function removeAttempt(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  checkoutKey: string,
) {
  try {
    const saved = JSON.parse(storage.getItem(key) ?? 'null')
    if (saved?.input?.idempotency_key === checkoutKey) storage.removeItem(key)
  } catch {
    /* Storage cleanup must not turn a confirmed sale into a failed checkout. */
  }
}

export function createAttempt(
  lines: CartLine[],
  discount: number,
  tendered: number,
  key: string,
  customer?: CustomerSelection,
): CheckoutAttempt {
  return {
    version: 1,
    input: {
      idempotency_key: key,
      items: lines.map((line) => ({
        product_id: line.product.id,
        quantity: line.quantity,
        expected_unit_price_centavos: line.product.price_centavos,
      })),
      discount_centavos: discount,
      payment: customer
        ? { method: 'credit', customer_id: customer.id }
        : { method: 'cash', tendered_centavos: tendered },
    },
    ...(customer
      ? {
          customer: {
            id: customer.id,
            store_id: customer.store_id,
            name: customer.name,
            phone: customer.phone,
            status: customer.status,
            balance_centavos: customer.balance_centavos,
          },
        }
      : {}),
    lines: lines.map(({ quantity, product }) => ({
      quantity,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        unit: product.unit,
        price_centavos: product.price_centavos,
        inventory: { ...product.inventory },
        status: product.status,
        emoji: product.emoji,
        color: product.color,
      },
    })),
  }
}

export function readAttempt(storage: StorageReader, key: string): CheckoutAttempt | null {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null') as CheckoutAttempt | null
    if (
      !value ||
      value.version !== 1 ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        value.input.idempotency_key,
      ) ||
      !Array.isArray(value.lines) ||
      value.lines.length < 1 ||
      value.lines.length > 100 ||
      !Array.isArray(value.input.items) ||
      value.input.items.length !== value.lines.length ||
      !['cash', 'credit'].includes(value.input.payment.method)
    )
      return null
    const payment = value.input.payment
    if (payment.method === 'credit') {
      if (
        !value.customer ||
        !Number.isSafeInteger(value.customer.id) ||
        value.customer.id < 1 ||
        !Number.isSafeInteger(value.customer.store_id) ||
        value.customer.store_id < 1 ||
        payment.customer_id !== value.customer.id ||
        typeof value.customer.name !== 'string' ||
        !value.customer.name.trim() ||
        value.customer.name.length > 120 ||
        !(value.customer.phone === null || typeof value.customer.phone === 'string') ||
        value.customer.status !== 'active' ||
        typeof value.customer.balance_centavos !== 'string' ||
        value.customer.balance_centavos.length > 19 ||
        !/^\d+$/.test(value.customer.balance_centavos)
      )
        return null
    }
    for (const amount of [
      value.input.discount_centavos,
      ...(payment.method === 'cash' ? [payment.tendered_centavos] : []),
    ])
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1000000000) return null
    const ids = new Set()
    for (let index = 0; index < value.lines.length; index++) {
      const { product, quantity } = value.lines[index]
      const item = value.input.items[index]
      if (
        !Number.isSafeInteger(product.id) ||
        product.id < 1 ||
        ids.has(product.id) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 1000000000 ||
        typeof product.name !== 'string' ||
        typeof product.unit !== 'string' ||
        typeof product.emoji !== 'string' ||
        !/^#[a-f0-9]{6}$/i.test(product.color) ||
        product.status !== 'active' ||
        !Number.isSafeInteger(product.inventory.quantity_on_hand) ||
        !Number.isSafeInteger(product.price_centavos) ||
        product.price_centavos < 0 ||
        product.price_centavos > 1000000000 ||
        item.product_id !== product.id ||
        item.quantity !== quantity ||
        item.expected_unit_price_centavos !== product.price_centavos
      )
        return null
      ids.add(product.id)
    }
    return value
  } catch {
    return null
  }
}
