import { ArrowUpRight, Check } from 'lucide-react'
import { money } from '../../lib/demo'
import type { Plan } from './plans'

export default function PlanCard({ plan, onExplore }: { plan: Plan; onExplore: () => void }) {
  return (
    <section
      className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 ${plan.featured ? 'border-forest bg-forest text-white shadow-[0_8px_32px_#214f3f14]' : 'border-stone-200/80 bg-white'}`}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-4 border-paper bg-[#eacb8b] px-3 py-0.5 text-[9px] font-bold tracking-[0.1em] text-forest">
          A LITTLE MORE POSSIBILITY
        </span>
      )}
      <span
        className={`mb-5 flex size-10 items-center justify-center rounded-xl ${plan.featured ? 'bg-white/10 text-[#e8cf97]' : 'bg-[#f0f3e9] text-forest'}`}
      >
        <plan.icon size={21} strokeWidth={1.6} />
      </span>
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p
        className={`mt-2 min-h-10 text-xs leading-relaxed ${plan.featured ? 'text-white/65' : 'text-stone-500'}`}
      >
        {plan.description}
      </p>
      <div className="mb-1 mt-6 flex items-end gap-1">
        <span className="font-display text-[44px] font-semibold leading-none tracking-tight">
          {money(plan.price).replace('.00', '')}
        </span>
        <span className={`pb-1.5 text-xs ${plan.featured ? 'text-white/55' : 'text-stone-400'}`}>
          / month
        </span>
      </div>
      <p className={`text-[10px] ${plan.featured ? 'text-white/55' : 'text-stone-400'}`}>
        {plan.name === 'Free'
          ? 'Proposed free tier · no card needed'
          : 'Proposed price · not yet available'}
      </p>
      <div className={`my-6 h-px ${plan.featured ? 'bg-white/12' : 'bg-stone-100'}`} />
      <ul className="mb-7 space-y-3.5">
        {plan.features.map((feature) => (
          <li
            className={`flex items-start gap-2.5 text-xs leading-relaxed ${plan.featured ? 'text-white/85' : 'text-stone-600'}`}
            key={feature}
          >
            <Check
              size={15}
              className={`mt-0.5 shrink-0 ${plan.featured ? 'text-[#c6daa9]' : 'text-[#76965b]'}`}
            />
            {feature}
          </li>
        ))}
      </ul>
      <button
        className={`mt-auto flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${plan.featured ? 'bg-[#e8cf97] text-forest hover:bg-[#f0dbaa]' : 'border border-stone-200 text-forest hover:bg-forest/5'}`}
        onClick={onExplore}
      >
        {plan.name === 'Free' ? 'View your plan' : `Explore ${plan.name}`}
        {plan.name !== 'Free' && <ArrowUpRight size={16} />}
      </button>
      <p
        className={`mt-3 text-center text-[10px] ${plan.featured ? 'text-white/45' : 'text-stone-400'}`}
      >
        {plan.footnote}
      </p>
    </section>
  )
}
