import { useState } from 'react'
import { ArrowUpRight, ChevronDown, ShieldCheck, Store, Zap } from 'lucide-react'
import { Badge, DemoNote, PageHeader } from '../../components/ui'
import { products } from '../../lib/demo'

import PlanCard from './PlanCard'
import PlanPreviewDialog from './PlanPreviewDialog'
import { plans } from './plans'
import type { Plan } from './plans'

export default function SubscriptionPage() {
  const [selected, setSelected] = useState<Plan | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="ROOM TO GROW"
        title="Your subscription"
        description="Start small. Grow at your own pace. Find a plan that feels right for your store."
      />
      <section className="panel mb-7 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-[#edf2e6] text-forest">
            <Store size={26} strokeWidth={1.5} />
          </span>
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <h2 className="text-base font-semibold">You're on the Free plan</h2>
              <Badge>Active</Badge>
            </div>
            <p className="text-xs text-stone-500">
              Your everyday store essentials, always within reach.
            </p>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-stone-500">Active products</span>
            <strong className="font-medium">
              {products.length} <span className="font-normal text-stone-400">/ 100 proposed</span>
            </strong>
          </div>
          <div className="h-1.5 rounded-full bg-[#edf0e9]">
            <div
              className="h-full rounded-full bg-[#7d9b6f]"
              style={{ width: `${products.length}%` }}
            />
          </div>
          <button
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-forest hover:underline"
            onClick={() => setSelected(plans[0])}
          >
            View current plan <ArrowUpRight size={12} />
          </button>
        </div>
      </section>
      <div className="mb-7 text-center">
        <span className="text-[10px] font-semibold tracking-[0.18em] text-stone-400">
          A PLAN FOR EVERY STAGE
        </span>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-forest">
          Good things grow from small beginnings.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
          Paid plans and prices below are proposals. This preview helps you explore what's planned;
          subscriptions are not available for purchase.
        </p>
      </div>
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} onExplore={() => setSelected(plan)} />
        ))}
      </div>
      <p className="mt-4 text-center text-[10px] leading-relaxed text-stone-400">
        *“Unlimited” capacity in paid plan proposals remains subject to a fair-use policy. Prices,
        limits, and features are not final.
      </p>
      <div className="my-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-stone-500">
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#7b9566]" />
          Your store data stays yours
        </span>
        <span className="flex items-center gap-2">
          <Zap size={16} className="text-[#7b9566]" />A useful free plan
        </span>
        <span className="flex items-center gap-2">
          <Store size={16} className="text-[#7b9566]" />
          Made for neighborhood stores
        </span>
      </div>
      <section className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-center font-display text-xl font-semibold">
          A few things you might be wondering
        </h2>
        {[
          {
            question: 'Can I subscribe to a paid plan now?',
            answer:
              'Not yet. Basic and Pro are product proposals. No subscription or payment is created when you explore a plan in this preview.',
          },
          {
            question: 'What happens to my data if I downgrade?',
            answer:
              'The planned policy preserves your records and sales history. If you exceed the new product limit, creating or reactivating products is restricted until your usage is within the limit.',
          },
          {
            question: 'Will my store customers need an account?',
            answer:
              'No. Your shoppers do not need to sign in. You can keep a simple customer contact for recording utang and repayments.',
          },
        ].map((item) => (
          <details className="group border-b border-stone-200/80 py-4" key={item.question}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                size={16}
                className="shrink-0 text-stone-400 transition group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 pr-7 text-sm leading-relaxed text-stone-500">{item.answer}</p>
          </details>
        ))}
      </section>
      <div className="mt-7">
        <DemoNote>
          Plan preview only · No payment, upgrade, or subscription change is made.
        </DemoNote>
      </div>
      {selected && <PlanPreviewDialog plan={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
