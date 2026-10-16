import { parseCentavos } from '../../lib/format'
import type { CartLine, CartProduct } from './types'

export interface CartState {
  lines: CartLine[]
  notice: string
}
type Action =
  | { type: 'add'; product: CartProduct }
  | { type: 'quantity'; id: number; delta: number }
  | { type: 'replace'; lines: CartLine[] }
  | { type: 'clear' }

export function cartReducer(state: CartState, action: Action): CartState {
  if (action.type === 'clear') return { lines: [], notice: '' }
  if (action.type === 'replace')
    return {
      lines: action.lines,
      notice: 'Prices and stock refreshed. Review your order before checkout.',
    }
  if (action.type === 'quantity')
    return {
      ...state,
      notice: '',
      lines: state.lines.flatMap((line) => {
        if (line.product.id !== action.id) return [line]
        const quantity = line.quantity + action.delta
        if (quantity <= 0) return []
        if (
          action.delta > 0 &&
          (quantity > line.product.inventory.quantity_on_hand || line.product.status !== 'active')
        )
          return [line]
        return [{ ...line, quantity }]
      }),
    }
  const { product } = action
  const existing = state.lines.find((line) => line.product.id === product.id)
  if (
    product.status !== 'active' ||
    (existing?.quantity ?? 0) >= product.inventory.quantity_on_hand
  )
    return {
      ...state,
      notice: `Only ${product.inventory.quantity_on_hand} ${product.unit}(s) of ${product.name} available.`,
    }
  if (!existing && state.lines.length >= 100)
    return { ...state, notice: 'An order can contain up to 100 different products.' }
  return {
    notice: '',
    lines: existing
      ? state.lines.map((line) =>
          line.product.id === product.id ? { product, quantity: line.quantity + 1 } : line,
        )
      : [...state.lines, { product, quantity: 1 }],
  }
}

export function cartTotals(
  lines: CartLine[],
  discountText: string,
  cashText: string,
  method: 'cash' | 'credit' = 'cash',
  customerId?: number,
) {
  let subtotal = 0,
    discount = 0,
    tendered = 0
  let reason = ''
  for (const line of lines) {
    if (
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1 ||
      line.product.status !== 'active' ||
      line.quantity > line.product.inventory.quantity_on_hand
    )
      reason = 'Review unavailable products or quantities in your order.'
    if (
      line.product.price_centavos > 0 &&
      line.quantity > Math.floor((1000000000 - subtotal) / line.product.price_centavos)
    )
      return {
        subtotal: 0,
        discount: 0,
        tendered: 0,
        total: 0,
        change: 0,
        valid: false,
        reason: 'A sale subtotal cannot exceed ₱10,000,000.00.',
      }
    subtotal += line.product.price_centavos * line.quantity
  }
  try {
    discount = parseCentavos(discountText || '0')
  } catch {
    reason = 'Enter a valid discount with at most two decimal places.'
  }
  if (discount > subtotal) reason = 'Discount cannot exceed the subtotal.'
  if (method === 'cash') {
    try {
      tendered = parseCentavos(cashText)
    } catch {
      reason ||= 'Enter a valid cash amount with at most two decimal places.'
    }
  }
  const total = Math.max(0, subtotal - discount)
  if (method === 'cash' && tendered < total) reason ||= 'Cash received must cover the total.'
  if (method === 'credit' && !customerId) reason ||= 'Select a customer for this utang sale.'
  if (method === 'credit' && total === 0) reason ||= 'Use Cash for a fully discounted sale.'
  if (!lines.length) reason = 'Add products to start an order.'
  return {
    subtotal,
    discount,
    tendered,
    total,
    change: Math.max(0, tendered - total),
    valid: !reason,
    reason,
  }
}
