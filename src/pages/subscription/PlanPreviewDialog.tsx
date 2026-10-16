import { Check } from 'lucide-react'
import { Modal } from '../../components/ui'
import { money } from '../../lib/demo'
import type { Plan } from './plans'

export default function PlanPreviewDialog({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  return (
    <Modal title={`${plan.name} plan preview`} onClose={onClose}>
      <div className="mb-5 rounded-xl bg-[#f0f3e9] p-5">
        <div className="flex items-center gap-2 text-forest">
          <plan.icon size={21} />
          <h3 className="text-lg font-semibold">{plan.name}</h3>
        </div>
        <p className="mt-3 font-display text-3xl font-semibold text-forest">
          {money(plan.price).replace('.00', '')}
          <span className="font-sans text-xs font-normal text-stone-500"> / month proposed</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">{plan.description}</p>
      </div>
      <ul className="space-y-3">
        {plan.features.map((feature) => (
          <li className="flex gap-2 text-sm text-stone-600" key={feature}>
            <Check size={16} className="mt-0.5 shrink-0 text-forest" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
        {plan.name === 'Free'
          ? 'This is the current sample plan. The 100-product cap is a proposal.'
          : 'Paid plans are not enabled. This is an informational preview, and all prices and limits remain proposals.'}{' '}
        No account or billing changes are made.
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Got it
        </button>
      </div>
    </Modal>
  )
}
