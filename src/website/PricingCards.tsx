import { ArrowUpRight, Check, Leaf, Sparkles } from 'lucide-react'
import { money } from '../lib/format'
import type { PublicSiteData } from './types'

export default function PricingCards({ data }: { data: PublicSiteData }) {
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
      {data.plans.map((plan) => {
        const soon = plan.catalog_status === 'coming_soon',
          featured = plan.featured && !soon
        return (
          <article
            key={plan.id}
            className={`flex flex-col rounded-3xl border p-6 ${featured ? 'border-forest bg-forest text-white shadow-lg shadow-forest/10' : 'border-forest/10 bg-white'}`}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              {plan.code === 'free' ? <Leaf size={25} /> : <Sparkles size={25} />}
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold ${featured ? 'bg-white/10' : 'bg-paper text-forest'}`}
              >
                {soon ? 'Coming soon' : plan.code === 'free' ? 'Start here' : 'Room to grow'}
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
            <p
              className={`mt-3 min-h-16 text-sm leading-relaxed ${featured ? 'text-white/70' : 'text-stone-500'}`}
            >
              {plan.description}
            </p>
            <p className="mt-5 font-display text-4xl font-bold tracking-tight">
              {money(plan.monthly_price_centavos).replace('.00', '')}
              <span
                className={`ml-1 font-sans text-xs font-normal ${featured ? 'text-white/60' : 'text-stone-500'}`}
              >
                / month
              </span>
            </p>
            <p className={`mt-2 text-xs ${featured ? 'text-white/65' : 'text-stone-500'}`}>
              {soon
                ? 'Planned pricing'
                : plan.code === 'free'
                  ? 'No payment needed'
                  : 'One-time subscription payments'}
            </p>
            <ul className="my-7 space-y-4 text-sm">
              {[
                `${plan.active_product_limit === null ? 'Unlimited' : plan.active_product_limit.toLocaleString('en-PH')} active products ${plan.quota_scope === 'account' ? 'across all stores' : 'per store'}`,
                `${plan.store_limit} ${plan.store_limit === 1 ? 'store' : 'stores'} · ${plan.staff_limit ? `${plan.staff_limit} staff + owner` : 'owner only'}`,
                'Cash & utang sales',
                'Inventory & customer balances',
                'Sales reports',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 opacity-70" />
                  <span>
                    {soon ? 'Planned: ' : ''}
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            {soon ? (
              <p className="mt-auto rounded-xl bg-paper p-3 text-center text-sm text-stone-500">
                Coming soon
              </p>
            ) : (
              <a
                href={
                  plan.code === 'basic' && data.billing_available ? '/signup?plan=basic' : '/signup'
                }
                className={`public-cta mt-auto ${featured ? 'bg-[#e8cf97] text-forest' : 'bg-paper text-forest'}`}
              >
                {plan.code === 'basic' && data.billing_available ? 'Choose Basic' : 'Start free'}
                <ArrowUpRight size={16} />
              </a>
            )}
          </article>
        )
      })}
    </div>
  )
}
