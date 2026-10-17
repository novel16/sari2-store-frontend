import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { subscriptionPath } from '../../subscriptions/format'
import type { Plan, SubscriptionReply } from '../../subscriptions/types'
import CurrentPlan from './CurrentPlan'
import PlanCard from './PlanCard'
import PlanDetailsDialog from './PlanDetailsDialog'
import SubscriptionQuestions from './SubscriptionQuestions'
import SubscriptionRenewal from './SubscriptionRenewal'

export default function SubscriptionWorkspace({ storeId }: { storeId: number }) {
  const result = useStoreQuery<SubscriptionReply>(subscriptionPath(storeId)),
    data = result.data?.data
  const [selected, setSelected] = useState<Plan | null>(null)
  return (
    <>
      <PageHeader
        eyebrow="ROOM TO GROW"
        title="Your subscription"
        description="Clear pricing and room for your store to grow."
        actions={
          <button className="btn btn-secondary" disabled={result.isLoading} onClick={result.reload}>
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {data && (
        <>
          <CurrentPlan current={data.current} usage={data.usage} />
          <SubscriptionRenewal current={data.current} renewal={data.renewal} />
          <div className="my-7 text-center">
            <p className="text-[10px] font-semibold tracking-[.18em] text-stone-400">
              A PLAN FOR EVERY STAGE
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
              Start small. Grow at your own pace.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
              Compare plans for your tindahan. Basic activation and renewal are handled by your
              service administrator after payment verification.
            </p>
          </div>
          <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
            {data.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={plan.code === data.current.plan.code}
                onExplore={() => setSelected(plan)}
                manualActivation={data.manual_activation_available}
              />
            ))}
          </div>
          <p className="my-5 text-center text-[11px] leading-relaxed text-stone-500">
            Product allowances count active product entries, not stock quantity. Archived products
            keep their sales history.
          </p>
          <SubscriptionQuestions />
        </>
      )}
      {selected && (
        <PlanDetailsDialog
          plan={selected}
          manualActivation={Boolean(data?.manual_activation_available)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
