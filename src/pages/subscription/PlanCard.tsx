import { ChevronDown, Check, Leaf, Sparkles, Crown, Layers } from 'lucide-react'
import { money } from '../../lib/format'
import { coreFeatures, ownerAccess, productAllowance } from '../../subscriptions/format'
import type { Plan } from '../../subscriptions/types'

export default function PlanCard({
  plan,
  current,
  manualActivation,
  billingAvailable = false,
  purchaseDisabled = false,
  onPurchase,
}: {
  plan: Plan
  current: boolean
  manualActivation: boolean
  billingAvailable?: boolean
  purchaseDisabled?: boolean
  onPurchase?: () => void
}) {
  const Icon =
      plan.code === 'free'
        ? Leaf
        : plan.code === 'basic'
          ? Sparkles
          : plan.code === 'pro'
            ? Crown
            : Layers,
    soon = plan.catalog_status === 'coming_soon'
  return (
    <section
      className={`relative flex min-w-0 flex-col rounded-2xl border p-5 sm:p-6 ${plan.featured ? 'border-forest bg-forest text-white shadow-sm' : 'border-stone-200/80 bg-white'}`}
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${plan.featured ? 'bg-white/10 text-[#e8cf97]' : 'bg-[#f0f3e9] text-forest'}`}
        >
          <Icon size={21} strokeWidth={1.6} />
        </span>
        {(soon || current) && (
          <span
            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${plan.featured ? 'bg-white/10 text-white/80' : 'bg-[#f0f3e9] text-forest'}`}
          >
            {soon ? 'Coming soon' : 'Current tier'}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p
        className={`mt-2 min-h-10 break-words text-xs leading-relaxed ${plan.featured ? 'text-white/65' : 'text-stone-500'}`}
      >
        {plan.description}
      </p>
      <p className="mb-1 mt-5 font-display text-[36px] font-semibold leading-tight tracking-tight">
        {money(plan.monthly_price_centavos).replace('.00', '')}
        <span
          className={`ml-1 font-sans text-[11px] font-normal tracking-normal ${plan.featured ? 'text-white/55' : 'text-stone-400'}`}
        >
          / month
        </span>
      </p>
      <p className={`text-[10px] ${plan.featured ? 'text-white/55' : 'text-stone-400'}`}>
        {soon
          ? 'Planned pricing'
          : plan.code === 'free'
            ? 'No payment needed'
            : billingAvailable && plan.code === 'basic'
              ? 'Pay using QR Ph'
              : manualActivation && plan.code === 'basic'
                ? 'Manual activation available'
                : 'Activation unavailable'}
      </p>
      <div className={`my-5 h-px ${plan.featured ? 'bg-white/12' : 'bg-stone-100'}`} />
      <ul className="mb-5 space-y-3">
        {[
          productAllowance(plan),
          `${soon ? 'Planned: ' : ''}${ownerAccess(plan)}`,
          ...coreFeatures,
        ].map((feature) => (
          <li
            key={feature}
            className={`flex items-start gap-2 text-xs leading-relaxed ${plan.featured ? 'text-white/85' : 'text-stone-600'}`}
          >
            <Check
              size={14}
              className={`mt-0.5 shrink-0 ${plan.featured ? 'text-[#c6daa9]' : 'text-[#76965b]'}`}
            />
            {feature}
          </li>
        ))}
      </ul>
      {plan.planned_features.length > 0 && (
        <div
          className={`mb-5 border-t pt-4 ${plan.featured ? 'border-white/10' : 'border-stone-100'}`}
        >
          <p
            className={`mb-2 text-[9px] font-semibold uppercase tracking-wide ${plan.featured ? 'text-white/50' : 'text-stone-400'}`}
          >
            Planned features
          </p>
          {plan.planned_features.map((feature) => (
            <p
              key={feature}
              className={`mt-1 text-[11px] ${plan.featured ? 'text-white/65' : 'text-stone-500'}`}
            >
              {feature}
            </p>
          ))}
        </div>
      )}
      {billingAvailable && plan.code === 'basic' && !soon && (
        <button
          className={`mb-3 flex min-h-11 items-center justify-center rounded-xl px-3 py-3 text-xs font-semibold disabled:opacity-50 ${plan.featured ? 'bg-[#e8cf97] text-forest' : 'bg-forest text-white'}`}
          disabled={purchaseDisabled}
          onClick={onPurchase}
        >
          {current ? 'Renew with QR Ph' : 'Choose Basic'}
        </button>
      )}
      <details
        className={`group mt-auto border-t pt-4 ${plan.featured ? 'border-white/15' : 'border-stone-100'}`}
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold [&::-webkit-details-marker]:hidden">
          View details
          <ChevronDown size={14} className="transition group-open:rotate-180" />
        </summary>
        <p
          className={`mt-2 text-xs leading-relaxed ${plan.featured ? 'text-white/80' : 'text-stone-500'}`}
        >
          {soon
            ? 'This plan is coming soon. Planned features are not available yet.'
            : plan.code === 'free'
              ? 'The Free plan includes your everyday store essentials. No payment is needed.'
              : billingAvailable && plan.code === 'basic'
                ? 'Choose your months and review the total on the checkout page, then continue to PayMongo QR Ph payment. Each renewal needs a new payment.'
                : manualActivation && plan.code === 'basic'
                  ? 'Contact your service administrator to activate or renew Basic after manual payment verification.'
                  : 'Activation for this offer is not available yet.'}
        </p>
      </details>
    </section>
  )
}
