import { Banknote, CreditCard } from 'lucide-react'
import type { AuthError } from '../../auth/errors'
import type { CustomerSelection } from '../../customers/types'
import { money } from '../../lib/format'
import type { cartTotals } from './cart'
import CustomerPicker from './CustomerPicker'

export default function PaymentSection({
  storeId,
  method,
  onMethod,
  customer,
  onCustomer,
  onAddCustomer,
  cash,
  onCash,
  totals,
  locked,
  error,
}: {
  storeId: number
  method: 'cash' | 'credit'
  onMethod: (method: 'cash' | 'credit') => void
  customer: CustomerSelection | null
  onCustomer: (customer: CustomerSelection | null) => void
  onAddCustomer: (name: string) => void
  cash: string
  onCash: (value: string) => void
  totals: ReturnType<typeof cartTotals>
  locked: boolean
  error: AuthError | null
}) {
  return (
    <>
      <fieldset disabled={locked}>
        <legend className="mb-2 text-[11px] font-semibold">Payment method</legend>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1">
          {(['cash', 'credit'] as const).map((value) => (
            <label key={value} className="relative cursor-pointer">
              <input
                className="peer sr-only"
                type="radio"
                name="payment_method"
                value={value}
                checked={method === value}
                onChange={() => onMethod(value)}
              />
              <span className="flex min-h-10 items-center justify-center gap-2 rounded-md text-xs font-semibold text-stone-500 transition peer-checked:bg-white peer-checked:text-forest peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
                {value === 'cash' ? <Banknote size={16} /> : <CreditCard size={16} />}
                {value === 'cash' ? 'Cash' : 'Utang'}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {method === 'credit' ? (
        <>
          <CustomerPicker
            storeId={storeId}
            customer={customer}
            disabled={locked}
            onSelect={onCustomer}
            onAdd={onAddCustomer}
          />
          {error?.fields['payment.customer_id']?.[0] && (
            <p role="alert" className="text-xs text-red-700">
              {error.fields['payment.customer_id'][0]}
            </p>
          )}
          <div className="flex justify-between gap-3 text-xs text-amber-900">
            <span>Add to customer's utang</span>
            <strong>{money(totals.total)}</strong>
          </div>
        </>
      ) : (
        <>
          <p className="text-[11px] text-stone-500">Cash · Walk-in customer</p>
          <label className="field">
            <span>Cash received (₱)</span>
            <input
              name="cash"
              aria-label="Cash received in pesos"
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              value={cash}
              disabled={locked}
              placeholder="0.00"
              onChange={(event) => onCash(event.target.value)}
              aria-invalid={Boolean(error?.fields['payment.tendered_centavos'])}
            />
            {error?.fields['payment.tendered_centavos']?.[0] && (
              <small className="text-red-700">{error.fields['payment.tendered_centavos'][0]}</small>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[50, 100, 200, 500].map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={locked}
                className="flex-1 rounded-md border border-stone-200 px-2 py-2 text-[10px] hover:bg-paper"
                onClick={() => onCash(String(amount))}
              >
                ₱{amount}
              </button>
            ))}
            <button
              type="button"
              disabled={locked}
              className="flex-1 rounded-md border border-stone-200 px-2 py-2 text-[10px] hover:bg-paper"
              onClick={() => onCash((totals.total / 100).toFixed(2))}
            >
              Exact
            </button>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">Change</span>
            <strong className="text-forest">{money(totals.change)}</strong>
          </div>
        </>
      )}
    </>
  )
}
