import { Store, ShieldCheck } from 'lucide-react'
import { money } from '../../lib/format'
import { ownerAccess, usagePercent } from '../../subscriptions/format'
import type { SubscriptionReply } from '../../subscriptions/types'

export default function CurrentPlan({
  current,
  usage,
}: {
  current: SubscriptionReply['data']['current']
  usage: SubscriptionReply['data']['usage']
}) {
  const { plan } = current
  return (
    <section className="panel p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#edf2e6] text-forest">
            <Store size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Current plan
            </p>
            <h2 className="mt-1 break-words font-display text-xl font-semibold text-forest">
              {plan.name}
              <span className="ml-3 inline-flex rounded-full bg-[#edf2e6] px-2.5 py-1 align-middle font-sans text-[10px] font-semibold">
                {current.status === 'free_fallback' ? 'Free allowance' : 'Active'}
              </span>
            </h2>
            <p className="mt-2 text-xs text-stone-500">
              {money(plan.monthly_price_centavos)}/month · {ownerAccess(plan)}
            </p>
            {current.ends_at && (
              <p className="mt-1 text-xs text-stone-500">
                Current period ends{' '}
                {new Intl.DateTimeFormat('en-PH', {
                  dateStyle: 'medium',
                  timeZone: 'Asia/Manila',
                }).format(new Date(current.ends_at))}
              </p>
            )}
          </div>
        </div>
        <div className="w-full sm:w-64">
          <div className="mb-2 flex justify-between gap-3 text-xs">
            <span className="text-stone-500">Active products</span>
            <strong>
              {usage.active_products.toLocaleString('en-PH')} /{' '}
              {usage.active_product_limit?.toLocaleString('en-PH') ?? 'Unlimited'}
            </strong>
          </div>
          {usage.active_product_limit !== null && (
            <div
              role="progressbar"
              aria-label="Active product usage"
              aria-valuemin={0}
              aria-valuemax={usage.active_product_limit}
              aria-valuenow={Math.min(usage.active_products, usage.active_product_limit)}
              className="h-2 overflow-hidden rounded-full bg-[#edf0e9]"
            >
              <div
                className={`h-full rounded-full ${usage.over_limit ? 'bg-amber-500' : 'bg-[#7d9b6f]'}`}
                style={{
                  width: `${usagePercent(usage.active_products, usage.active_product_limit)}%`,
                }}
              />
            </div>
          )}
          <p className="mt-2 text-[10px] text-stone-400">
            {usage.quota_scope === 'account'
              ? 'Shared across all your stores'
              : 'Allowance for this store'}{' '}
            · {usage.stores} registered store(s)
          </p>
        </div>
      </div>
      {current.saved_terms && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-[#edf2e6] p-3 text-xs leading-relaxed text-forest">
          <ShieldCheck size={16} className="shrink-0" />
          Your saved price and allowances remain in effect for this subscription. The current
          catalog may show a newer offer.
        </p>
      )}
      {usage.over_limit && (
        <p
          role="status"
          className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800"
        >
          You are above your current product allowance. Your existing products, sales, stock, and
          utang remain available. Archive unused products to make room before adding or restoring
          products.
        </p>
      )}
    </section>
  )
}
