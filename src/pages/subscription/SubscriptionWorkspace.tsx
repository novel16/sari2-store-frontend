import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { subscriptionPath } from '../../subscriptions/format'
import type { SubscriptionReply } from '../../subscriptions/types'
import CurrentPlan from './CurrentPlan'
import PlanCard from './PlanCard'
import SubscriptionQuestions from './SubscriptionQuestions'
import SubscriptionRenewal from './SubscriptionRenewal'
import { paymentPath, purchasePath } from '../../subscriptions/payments/checkout'
import { usePurchase } from '../../subscriptions/payments/usePurchase'
import PurchaseRecovery from '../../subscriptions/payments/PurchaseRecovery'
import PaymentHistory from '../../subscriptions/payments/PaymentHistory'

export default function SubscriptionWorkspace({
  userId,
  storeId,
}: {
  userId: number
  storeId: number
}) {
  const result = useStoreQuery<SubscriptionReply>(subscriptionPath(storeId)),
    data = result.data?.data
  const [revision, setRevision] = useState(0)
  const navigate = useNavigate()
  const purchase = usePurchase(
    userId,
    storeId,
    (order) => navigate(paymentPath(order.id)),
    result.reload,
  )
  const checkoutBlocked = purchase.pending || Boolean(purchase.attempt || data?.pending_order)
  return (
    <>
      <PageHeader
        eyebrow="ROOM TO GROW"
        title="Your subscription"
        description="Clear pricing and room for your store to grow."
        actions={
          <button
            className="btn btn-secondary"
            disabled={result.isLoading}
            onClick={() => {
              result.reload()
              setRevision((value) => value + 1)
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {purchase.error && !purchase.attempt && (
        <p role="alert" className="my-4 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
          {purchase.error.message}
        </p>
      )}
      {data && (
        <>
          <CurrentPlan current={data.current} usage={data.usage} />
          <SubscriptionRenewal
            current={data.current}
            renewal={data.renewal}
            billingAvailable={data.billing_available}
          />
          {data.pending_order && (
            <section className="panel mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="text-sm font-semibold text-forest">You have a payment to check</h2>
                <p className="mt-2 text-xs text-stone-500">
                  Resume your checkout or check its status before starting another payment.
                </p>
              </div>
              <Link className="btn btn-primary" to={paymentPath(data.pending_order.id)}>
                View pending payment
              </Link>
            </section>
          )}
          {purchase.attempt && <PurchaseRecovery purchase={purchase} />}
          <div className="my-7 text-center">
            <p className="text-[10px] font-semibold tracking-[.18em] text-stone-400">
              A PLAN FOR EVERY STAGE
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
              Start small. Grow at your own pace.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
              {data.billing_available
                ? 'Choose Basic and pay using QR Ph. Your subscription activates automatically after payment is verified.'
                : 'Compare plans for your tindahan. Basic activation and renewal are handled by your service administrator after payment verification.'}
            </p>
          </div>
          <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
            {data.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={plan.code === data.current.plan.code}
                manualActivation={data.manual_activation_available}
                billingAvailable={data.billing_available}
                purchaseDisabled={checkoutBlocked}
                onPurchase={() => navigate(purchasePath(plan.code))}
              />
            ))}
          </div>
          <p className="my-5 text-center text-[11px] leading-relaxed text-stone-500">
            Product allowances count active product entries, not stock quantity. Archived products
            keep their sales history.
          </p>
          <SubscriptionQuestions billingAvailable={data.billing_available} />
          <PaymentHistory
            key={`${storeId}:${revision}`}
            storeId={storeId}
            onSelect={(id) => navigate(paymentPath(id))}
          />
        </>
      )}
    </>
  )
}
