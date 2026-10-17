import { CalendarClock } from 'lucide-react'
import { money } from '../../lib/format'
import { renewalState } from '../../subscriptions/renewal'
import type { SubscriptionReply } from '../../subscriptions/types'

const date = (value: string) =>
  new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))

export default function SubscriptionRenewal({
  current,
  renewal,
}: {
  current: SubscriptionReply['data']['current']
  renewal: SubscriptionReply['data']['renewal']
}) {
  const state = renewalState(current, renewal),
    next = renewal.next_period
  return (
    <section className="panel mt-5 flex min-w-0 items-start gap-3 p-5 sm:p-6">
      <CalendarClock className="mt-0.5 shrink-0 text-forest" size={20} />
      <div className="min-w-0 text-xs leading-relaxed text-stone-500">
        <h3 className="mb-2 text-sm font-semibold text-forest">
          {state === 'scheduled'
            ? 'Renewal scheduled'
            : state === 'expired'
              ? 'Paid period ended'
              : state === 'expiring'
                ? 'Your paid period ends soon'
                : 'Manual activation & renewal'}
        </h3>
        {next ? (
          <>
            <p>
              {next.plan.name} starts {date(next.starts_at)} (PHT)
              {next.ends_at ? ` and ends ${date(next.ends_at)} (PHT)` : ''}.
            </p>
            <p className="mt-1">
              Saved offer: {money(next.plan.monthly_price_centavos)}/month ·{' '}
              {next.plan.active_product_limit?.toLocaleString('en-PH') ?? 'Unlimited'} active
              products.
            </p>
            {renewal.scheduled_periods > 1 && (
              <p className="mt-1">
                {renewal.scheduled_periods} periods are scheduled. The next period is shown above.
              </p>
            )}
          </>
        ) : state === 'expired' ? (
          <p>
            {renewal.last_paid_ended_at
              ? `Your last paid period ended ${date(renewal.last_paid_ended_at)} (PHT). `
              : ''}
            Free allowances apply after expiry. Your products, sales, inventory, and customer utang
            stay available.
          </p>
        ) : current.plan.code !== 'free' ? (
          <p>
            {current.ends_at
              ? `No renewal is scheduled. Your current paid period ends ${date(current.ends_at)} (PHT).`
              : 'Your paid period has no recorded end date. Contact your service administrator before renewing.'}
          </p>
        ) : (
          <p>You can keep using Free or contact your service administrator to activate Basic.</p>
        )}
        <p className="mt-2">
          To activate or renew Basic, contact your service administrator for manual payment
          verification. There are no automatic charges. Plus and Pro are coming soon.
        </p>
      </div>
    </section>
  )
}
