import { ArrowRight, Minus, Plus, RefreshCw, ShoppingBasket, Trash2 } from 'lucide-react'
import { ProductArt } from '../../components/ui'
import FormError from '../../auth/components/FormError'
import type { AuthError } from '../../auth/errors'
import { money } from '../../lib/format'
import type { cartTotals } from './cart'
import type { CartLine } from './types'
import type { CustomerSelection } from '../../customers/types'
import PaymentSection from './PaymentSection'

type Props = {
  storeId: number
  method: 'cash' | 'credit'
  onMethod: (method: 'cash' | 'credit') => void
  customer: CustomerSelection | null
  onCustomer: (customer: CustomerSelection | null) => void
  onAddCustomer: (name: string) => void
  lines: CartLine[]
  cash: string
  discount: string
  onCash: (value: string) => void
  onDiscount: (value: string) => void
  totals: ReturnType<typeof cartTotals>
  locked: boolean
  pending: boolean
  error: AuthError | null
  onQuantity: (id: number, delta: number) => void
  onClear: () => void
  onRefresh: () => void
  onReview: () => void
}

export default function CartPanel({
  storeId,
  method,
  onMethod,
  customer,
  onCustomer,
  onAddCustomer,
  lines,
  cash,
  discount,
  onCash,
  onDiscount,
  totals,
  locked,
  pending,
  error,
  onQuantity,
  onClear,
  onRefresh,
  onReview,
}: Props) {
  return (
    <section className="panel min-w-0 xl:sticky xl:top-23">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBasket size={17} className="text-forest" />
          <h2 className="font-display text-sm font-bold">Current order</h2>
          <span className="text-[10px] text-stone-500">
            {lines.reduce((sum, line) => sum + line.quantity, 0)} items
          </span>
        </div>
        <div className="flex">
          <button
            className="icon-button"
            disabled={locked || !lines.length}
            onClick={onRefresh}
            aria-label="Refresh cart prices and stock"
          >
            <RefreshCw size={14} />
          </button>
          <button
            className="icon-button"
            disabled={locked || !lines.length}
            onClick={onClear}
            aria-label="Clear cart"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="max-h-80 min-h-37 overflow-y-auto px-5">
        {!lines.length ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-stone-500">
            <ShoppingBasket size={28} />
            <strong className="text-xs">A fresh little basket</strong>
            <span className="text-[11px]">Tap a product to start your next sale.</span>
          </div>
        ) : (
          lines.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-2.5 border-b border-stone-100 py-4 last:border-0"
            >
              <ProductArt product={product} small />
              <div className="min-w-0 flex-1">
                <strong className="block break-words text-xs">{product.name}</strong>
                <span className="mt-1 block text-[10px] text-stone-500">
                  {money(product.price_centavos)} / {product.unit}
                </span>
                {(product.status !== 'active' || quantity > product.inventory.quantity_on_hand) && (
                  <p className="mt-1 text-[10px] text-red-700">
                    {product.status !== 'active'
                      ? 'Unavailable — remove from order'
                      : `Only ${product.inventory.quantity_on_hand} available`}
                  </p>
                )}
                <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-stone-200">
                  <button
                    className="grid size-11 place-items-center sm:size-8"
                    disabled={locked}
                    aria-label={`Decrease ${product.name}`}
                    onClick={() => onQuantity(product.id, -1)}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="min-w-3 text-center text-[11px]">{quantity}</span>
                  <button
                    className="grid size-11 place-items-center sm:size-8"
                    disabled={
                      locked ||
                      product.status !== 'active' ||
                      quantity >= product.inventory.quantity_on_hand
                    }
                    aria-label={`Increase ${product.name}`}
                    onClick={() => onQuantity(product.id, 1)}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  className="ml-2 min-h-11 text-xs text-stone-500 hover:text-red-700 sm:min-h-0 sm:text-[10px]"
                  disabled={locked}
                  aria-label={`Remove ${product.name}`}
                  onClick={() => onQuantity(product.id, -quantity)}
                >
                  Remove
                </button>
              </div>
              <strong className="text-[11px]">{money(product.price_centavos * quantity)}</strong>
            </div>
          ))
        )}
      </div>
      <div className="space-y-4 border-t border-stone-100 p-5">
        <FormError error={error} />
        {error &&
          Object.entries(error.fields)
            .filter(([key]) => key.startsWith('items'))
            .map(([key, messages]) => (
              <p key={key} role="alert" className="text-xs text-red-700">
                {messages[0]}
              </p>
            ))}
        <div className="flex justify-between text-xs text-stone-500">
          <span>Subtotal</span>
          <strong className="text-ink">{money(totals.subtotal)}</strong>
        </div>
        <label className="field">
          <span>Discount (₱)</span>
          <input
            name="discount"
            type="number"
            min="0"
            max="10000000"
            step="0.01"
            value={discount}
            disabled={locked}
            onChange={(event) => onDiscount(event.target.value)}
            aria-invalid={Boolean(error?.fields.discount_centavos)}
          />
          {error?.fields.discount_centavos?.[0] && (
            <small className="text-red-700">{error.fields.discount_centavos[0]}</small>
          )}
        </label>
        <div className="flex items-center justify-between gap-2 border-t border-dashed border-stone-200 pt-4">
          <strong className="text-xs">Total amount</strong>
          <strong className="text-2xl font-bold tracking-tight text-forest">
            {money(totals.total)}
          </strong>
        </div>
        <PaymentSection
          storeId={storeId}
          method={method}
          onMethod={onMethod}
          customer={customer}
          onCustomer={onCustomer}
          onAddCustomer={onAddCustomer}
          cash={cash}
          onCash={onCash}
          totals={totals}
          locked={locked}
          error={error}
        />
        {!totals.valid && lines.length > 0 && (
          <p className="text-[11px] leading-relaxed text-stone-500">{totals.reason}</p>
        )}
        <button
          className="btn btn-primary w-full !py-3.5"
          disabled={locked || !totals.valid}
          onClick={onReview}
        >
          {pending
            ? 'Saving sale…'
            : method === 'credit'
              ? 'Review utang sale'
              : 'Review cash sale'}
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  )
}
