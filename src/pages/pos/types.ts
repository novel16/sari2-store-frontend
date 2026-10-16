import type { Product } from '../../catalog/types'
import type { CheckoutInput } from '../../sales/types'
import type { CustomerSelection } from '../../customers/types'

export type CartProduct = Pick<
  Product,
  | 'id'
  | 'name'
  | 'description'
  | 'unit'
  | 'price_centavos'
  | 'status'
  | 'inventory'
  | 'emoji'
  | 'color'
>
export interface CartLine {
  product: CartProduct
  quantity: number
}
export interface CheckoutAttempt {
  version: 1
  input: CheckoutInput
  lines: CartLine[]
  customer?: CustomerSelection
}
