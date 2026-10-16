import type { CartLine } from './types'
import type { CustomerSelection } from '../../customers/types'

export interface PosDraft {
  version: 1
  store_id: number
  lines: CartLine[]
  cash: string
  discount: string
  method: 'cash' | 'credit'
  customer: CustomerSelection | null
}

export const draftPrefix = (userId: number) => `sarisari:draft:v1:${userId}:`
export const draftStorageKey = (userId: number, storeId: number) =>
  `${draftPrefix(userId)}${storeId}`

export function hasDraft(
  draft: Pick<PosDraft, 'lines' | 'cash' | 'discount' | 'method' | 'customer'>,
) {
  return (
    draft.lines.length > 0 ||
    draft.cash !== '' ||
    !['', '0', '0.00'].includes(draft.discount) ||
    draft.method !== 'cash' ||
    draft.customer !== null
  )
}

export function readDraft(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  storeId: number,
): PosDraft | null {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null') as PosDraft | null
    if (
      !value ||
      value.version !== 1 ||
      value.store_id !== storeId ||
      !Array.isArray(value.lines) ||
      value.lines.length > 100 ||
      !['cash', 'credit'].includes(value.method)
    )
      return null
    if (
      ![value.cash, value.discount].every(
        (text) => typeof text === 'string' && text.length <= 24 && /^[\d.]*$/.test(text),
      )
    )
      return null
    const ids = new Set<number>()
    const lines: CartLine[] = value.lines.map(({ product, quantity }) => {
      if (
        !Number.isSafeInteger(product.id) ||
        product.id < 1 ||
        ids.has(product.id) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 1e9 ||
        !Number.isSafeInteger(product.price_centavos) ||
        product.price_centavos < 0 ||
        product.price_centavos > 1e9 ||
        !Number.isSafeInteger(product.inventory.quantity_on_hand) ||
        product.inventory.quantity_on_hand < 0 ||
        !Number.isSafeInteger(product.inventory.version) ||
        product.inventory.version < 0 ||
        !['active', 'archived'].includes(product.status) ||
        typeof product.name !== 'string' ||
        product.name.length > 120 ||
        typeof product.unit !== 'string' ||
        product.unit.length > 30 ||
        typeof product.emoji !== 'string' ||
        product.emoji.length > 30 ||
        typeof product.color !== 'string' ||
        !/^#[a-f0-9]{6}$/i.test(product.color) ||
        !(
          product.description === null ||
          (typeof product.description === 'string' && product.description.length <= 255)
        )
      )
        throw new Error('Invalid saved product')
      ids.add(product.id)
      return {
        quantity,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          unit: product.unit,
          price_centavos: product.price_centavos,
          status: product.status,
          inventory: {
            quantity_on_hand: product.inventory.quantity_on_hand,
            version: product.inventory.version,
          },
          emoji: product.emoji,
          color: product.color,
        },
      }
    })
    const customer = value.customer
    if (
      customer &&
      (!Number.isSafeInteger(customer.id) ||
        customer.id < 1 ||
        customer.store_id !== storeId ||
        typeof customer.name !== 'string' ||
        customer.name.length > 120 ||
        !(
          customer.phone === null ||
          (typeof customer.phone === 'string' && customer.phone.length <= 30)
        ) ||
        !['active', 'archived'].includes(customer.status) ||
        typeof customer.balance_centavos !== 'string' ||
        !/^(0|[1-9][0-9]{0,18})$/.test(customer.balance_centavos))
    )
      return null
    return {
      version: 1,
      store_id: storeId,
      lines,
      cash: value.cash,
      discount: value.discount,
      method: value.method,
      customer: customer
        ? {
            id: customer.id,
            store_id: storeId,
            name: customer.name,
            phone: customer.phone,
            status: customer.status,
            balance_centavos: customer.balance_centavos,
          }
        : null,
    }
  } catch {
    return null
  }
}

export function clearUserDrafts(
  storage: Pick<Storage, 'length' | 'key' | 'removeItem'>,
  userId: number,
) {
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index)
    if (key?.startsWith(draftPrefix(userId))) storage.removeItem(key)
  }
}
