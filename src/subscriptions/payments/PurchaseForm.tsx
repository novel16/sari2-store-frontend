import { useState } from 'react'
import { ArrowRight, Check, LoaderCircle, QrCode } from 'lucide-react'
import { money } from '../../lib/format'
import { coreFeatures, ownerAccess, productAllowance } from '../format'
import type { AuthError } from '../../auth/errors'
import type { Plan } from '../types'

export default function PurchaseForm({
  plan,
  pending,
  error,
  onConfirm,
}: {
  plan: Plan
  pending: boolean
  error: AuthError | null
  onConfirm: (months: number) => void
}) {
  const [months, setMonths] = useState(1)
  return (
    <form
      className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]"
      onSubmit={(event) => {
        event.preventDefault()
        if (!pending) onConfirm(months)
      }}
    >
      <section className="panel p-6 sm:p-8" aria-labelledby="duration-heading">
        <p className="eyebrow">YOUR PLAN</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-forest">{plan.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{plan.description}</p>
        <ul className="my-6 space-y-3 text-sm text-stone-600">
          {[productAllowance(plan), ownerAccess(plan), ...coreFeatures].map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-forest" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="border-t border-stone-100 pt-6">
          <h3 id="duration-heading" className="text-sm font-semibold text-forest">
            How long would you like to subscribe?
          </h3>
          <label className="mt-4 block text-xs font-semibold" htmlFor="subscription-months">
            Months
          </label>
          <select
            id="subscription-months"
            className="input mt-2 w-full"
            value={months}
            disabled={pending}
            onChange={(event) => setMonths(Number(event.target.value))}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? 'month' : 'months'}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            Pay once for your selected months. There are no automatic charges.
          </p>
        </div>
      </section>
      <section
        className="panel overflow-hidden lg:sticky lg:top-24"
        aria-labelledby="summary-heading"
      >
        <div className="border-b border-stone-100 bg-forest/5 p-6 sm:px-8">
          <h2 id="summary-heading" className="text-lg font-semibold text-forest">
            Payment summary
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Review your plan and total before continuing.
          </p>
        </div>
        <div className="p-6 sm:p-8">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Plan</dt>
              <dd>{plan.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Monthly price</dt>
              <dd>{money(plan.monthly_price_centavos)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Duration</dt>
              <dd>
                {months} {months === 1 ? 'month' : 'months'}
              </dd>
            </div>
            <div
              className="flex justify-between gap-3 border-t border-stone-100 pt-5 font-semibold text-forest"
              aria-live="polite"
              aria-atomic="true"
            >
              <dt>Total to pay</dt>
              <dd className="text-xl">{money(plan.monthly_price_centavos * months)}</dd>
            </div>
          </dl>
          <div className="my-6 flex items-start gap-3 rounded-xl bg-paper p-4">
            <QrCode size={22} className="shrink-0 text-forest" />
            <p className="text-xs leading-relaxed text-stone-500">
              You will continue to PayMongo to pay using QR Ph. Your subscription activates after
              payment is verified.
            </p>
          </div>
          <p className="text-xs leading-relaxed text-stone-500">
            New coverage starts after verified payment. Renewals extend your existing paid coverage.
            The price and allowances shown here are saved with your order.
          </p>
          {error && (
            <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-xs text-red-700">
              <p>{error.message}</p>
              {Object.values(error.fields)
                .flat()
                .map((message) => (
                  <p key={message}>{message}</p>
                ))}
            </div>
          )}
          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={pending}>
            {pending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
            {pending ? 'Preparing checkout…' : 'Proceed to QR Ph payment'}
          </button>
        </div>
      </section>
    </form>
  )
}
