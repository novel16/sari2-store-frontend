import { Check } from 'lucide-react'
import { Modal } from '../../components/ui'
import { money } from '../../lib/format'
import { coreFeatures, ownerAccess, productAllowance } from '../../subscriptions/format'
import type { Plan } from '../../subscriptions/types'
export default function PlanDetailsDialog({
  plan,
  onClose,
  manualActivation,
  billingAvailable = false,
}: {
  plan: Plan
  onClose: () => void
  manualActivation: boolean
  billingAvailable?: boolean
}) {
  const soon = plan.catalog_status === 'coming_soon'
  return (
    <Modal title={`${plan.name} plan`} onClose={onClose}>
      <div className="mb-5 rounded-xl bg-[#f0f3e9] p-5">
        <p className="font-display text-3xl font-semibold text-forest">
          {money(plan.monthly_price_centavos)}
          <span className="ml-1 font-sans text-xs font-normal text-stone-500">
            / month{soon ? ' · planned' : ''}
          </span>
        </p>
        <p className="mt-2 break-words text-xs leading-relaxed text-stone-500">
          {plan.description}
        </p>
      </div>
      <ul className="space-y-3">
        {[
          productAllowance(plan),
          `${soon ? 'Planned: ' : ''}${ownerAccess(plan)}`,
          ...coreFeatures,
        ].map((feature) => (
          <li className="flex gap-2 text-sm text-stone-600" key={feature}>
            <Check size={16} className="mt-0.5 shrink-0 text-forest" />
            {feature}
          </li>
        ))}
      </ul>
      {plan.planned_features.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-stone-500">
          Planned features: {plan.planned_features.join(', ')}.
        </p>
      )}
      <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
        {soon
          ? 'This plan is coming soon. Planned features are not available yet.'
          : plan.code === 'free'
            ? 'The Free plan includes your everyday store essentials.'
            : billingAvailable && plan.code === 'basic'
              ? 'Choose Basic on the subscription page, review your duration and total, then pay using PayMongo QR Ph. Activation follows verified payment. Each renewal needs a new payment.'
              : manualActivation && plan.code === 'basic'
                ? 'Contact your service administrator to activate or renew Basic after manual payment verification. There is no automatic billing. Each confirmed period keeps its saved price and allowances.'
                : 'Activation for this offer is not available yet.'}
      </p>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Got it
        </button>
      </div>
    </Modal>
  )
}
