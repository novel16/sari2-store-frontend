import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { isOrderId } from '../../subscriptions/payments/checkout'
import { usePurchase } from '../../subscriptions/payments/usePurchase'
import PurchaseDialog from '../../subscriptions/payments/PurchaseDialog'
import PaymentOrderPanel from '../../subscriptions/payments/PaymentOrderPanel'
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
  const [selected, setSelected] = useState<Plan | null>(null)
  const [buying, setBuying] = useState<Plan | null>(null)
  const [revision, setRevision] = useState(0)
  const [params, setParams] = useSearchParams()
  const queryOrder = params.get('order')
  const orderId = isOrderId(queryOrder) ? queryOrder : data?.pending_order?.id
  function selectOrder(id: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('order', id)
        next.delete('payment')
        return next
      },
      { replace: true },
    )
  }
  const purchase = usePurchase(
    userId,
    storeId,
    (order) => {
      setBuying(null)
      selectOrder(order.id)
      setRevision((value) => value + 1)
      result.reload()
    },
    () => {
      setBuying(null)
      result.reload()
    },
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
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {data && (
        <>
          <CurrentPlan current={data.current} usage={data.usage} />
          <SubscriptionRenewal
            current={data.current}
            renewal={data.renewal}
            billingAvailable={data.billing_available}
          />
          {data.pending_order && orderId !== data.pending_order.id && (
            <button
              className="btn btn-secondary mt-4"
              onClick={() => selectOrder(data.pending_order!.id)}
            >
              View pending checkout
            </button>
          )}
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
                onExplore={() => setSelected(plan)}
                manualActivation={data.manual_activation_available}
                billingAvailable={data.billing_available}
                purchaseDisabled={checkoutBlocked}
                onPurchase={() => setBuying(plan)}
              />
            ))}
          </div>
          <p className="my-5 text-center text-[11px] leading-relaxed text-stone-500">
            Product allowances count active product entries, not stock quantity. Archived products
            keep their sales history.
          </p>
          <SubscriptionQuestions billingAvailable={data.billing_available} />
        </>
      )}
      {purchase.error && !purchase.attempt && !buying && (
        <p role="alert" className="my-4 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
          {purchase.error.message}
        </p>
      )}
      {purchase.attempt && (
        <section className="panel mt-5 p-5" role="status">
          <h2 className="text-sm font-semibold text-forest">Recover your checkout</h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            The last checkout result is not confirmed. Check for its saved order, or retry the same
            request before starting another payment.
          </p>
          {purchase.error && (
            <p role="alert" className="mt-3 text-xs text-red-700">
              {purchase.error.message}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="btn btn-primary"
              disabled={purchase.pending}
              onClick={() => void purchase.check()}
            >
              Check saved order
            </button>
            <button
              className="btn btn-secondary"
              disabled={purchase.pending}
              onClick={() => void purchase.retry()}
            >
              Retry same checkout
            </button>
          </div>
        </section>
      )}
      {orderId && (
        <PaymentOrderPanel
          key={`${orderId}:${revision}`}
          orderId={orderId}
          storeId={storeId}
          onUpdated={result.reload}
        />
      )}
      {data && (
        <PaymentHistory key={`${storeId}:${revision}`} storeId={storeId} onSelect={selectOrder} />
      )}
      {buying && (
        <PurchaseDialog
          plan={buying}
          pending={purchase.pending}
          error={purchase.error}
          locked={Boolean(purchase.attempt) && !purchase.pending}
          onClose={() => setBuying(null)}
          onConfirm={(months) => void purchase.purchase(buying, months)}
        />
      )}
      {selected && (
        <PlanDetailsDialog
          plan={selected}
          manualActivation={Boolean(data?.manual_activation_available)}
          billingAvailable={Boolean(data?.billing_available)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
