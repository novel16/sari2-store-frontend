import { ArrowLeft, Banknote, Check, CreditCard, LoaderCircle } from 'lucide-react'
import { Modal } from '../../components/ui'
import { money } from '../../lib/format'
import type { cartTotals } from './cart'
import type { CartLine } from './types'
import type { CustomerSelection } from '../../customers/types'

type Props = {
  method: 'cash' | 'credit'
  customer: CustomerSelection | null
  lines: CartLine[]
  totals: ReturnType<typeof cartTotals>
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function CheckoutConfirmationDialog({
  method,
  customer,
  lines,
  totals,
  pending,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      title={method === 'credit' ? 'Review utang sale' : 'Review cash sale'}
      onClose={onCancel}
      dismissible={!pending}
    >
      <div aria-busy={pending}>
        <p className="mb-4 text-xs leading-relaxed text-stone-600">
          Check the items and payment before saving. Confirming this sale will update your stock.
        </p>
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-2 font-semibold text-forest">
            {method === 'credit' ? (
              <>
                <CreditCard size={17} /> Utang
              </>
            ) : (
              <>
                <Banknote size={17} /> Cash payment
              </>
            )}
          </span>
          <span className="text-stone-500">
            {lines.reduce((sum, line) => sum + line.quantity, 0)} items
          </span>
        </div>
        {method === 'credit' && customer && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <span className="block text-[10px]">Charge utang to</span>
            <strong className="mt-1 block break-words">{customer.name}</strong>
            {customer.phone && <span className="mt-1 block">{customer.phone}</span>}
          </div>
        )}
        <ol
          className="max-h-48 divide-y divide-stone-100 overflow-y-auto rounded-xl border border-stone-200 px-4"
          aria-label="Items to confirm"
          tabIndex={0}
        >
          {lines.map(({ product, quantity }) => (
            <li key={product.id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <strong className="block break-words text-xs">{product.name}</strong>
                <p className="mt-1 text-[11px] text-stone-500">
                  {quantity} × {money(product.price_centavos)} / {product.unit}
                </p>
              </div>
              <strong className="shrink-0 text-xs tabular-nums">
                {money(product.price_centavos * quantity)}
              </strong>
            </li>
          ))}
        </ol>
        <dl className="mt-5 space-y-3 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Subtotal</dt>
            <dd className="tabular-nums">{money(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Discount</dt>
            <dd className="tabular-nums">{money(totals.discount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-y border-dashed border-stone-200 py-4 font-bold">
            <dt>{method === 'credit' ? 'Add to utang' : 'Total to pay'}</dt>
            <dd className="text-2xl tabular-nums text-forest">{money(totals.total)}</dd>
          </div>
          {method === 'cash' ? (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Cash received</dt>
                <dd className="tabular-nums">{money(totals.tendered)}</dd>
              </div>
              <div className="flex justify-between gap-4 font-semibold text-forest">
                <dt>Change</dt>
                <dd className="tabular-nums">{money(totals.change)}</dd>
              </div>
            </>
          ) : (
            customer && (
              <>
                <div className="flex justify-between gap-4">
                  <dt>Current utang</dt>
                  <dd>{money(customer.balance_centavos)}</dd>
                </div>
                <div className="flex justify-between gap-4 font-semibold text-amber-900">
                  <dt>Balance after sale (estimate)</dt>
                  <dd>
                    {money((BigInt(customer.balance_centavos) + BigInt(totals.total)).toString())}
                  </dd>
                </div>
              </>
            )
          )}
        </dl>
        {pending && (
          <p role="status" className="mt-4 text-xs text-stone-600">
            Saving your sale. Please wait for confirmation.
          </p>
        )}
        <div className="mt-6 grid gap-3 border-t border-stone-100 pt-5 sm:grid-cols-2">
          <button
            type="button"
            className="btn btn-secondary"
            data-autofocus
            disabled={pending}
            onClick={onCancel}
          >
            <ArrowLeft size={15} /> Back to cart
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || !totals.valid}
            onClick={onConfirm}
          >
            {pending ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
            {pending ? 'Saving sale…' : 'Confirm & save sale'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
