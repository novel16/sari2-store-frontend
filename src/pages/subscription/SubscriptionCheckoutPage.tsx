import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { subscriptionPath } from '../../subscriptions/format'
import type { SubscriptionReply } from '../../subscriptions/types'
import { paymentPath, resumableCheckoutUrl } from '../../subscriptions/payments/checkout'
import { usePurchase } from '../../subscriptions/payments/usePurchase'
import PurchaseForm from '../../subscriptions/payments/PurchaseForm'
import PurchaseRecovery from '../../subscriptions/payments/PurchaseRecovery'

export default function SubscriptionCheckoutPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <SubscriptionCheckoutWorkspace
      key={`${user.id}:${store.id}`}
      userId={user.id}
      storeId={store.id}
    />
  ) : null
}

function SubscriptionCheckoutWorkspace({ userId, storeId }: { userId: number; storeId: number }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const result = useStoreQuery<SubscriptionReply>(subscriptionPath(storeId))
  const data = result.data?.data
  const plan = data?.plans.find((item) => item.code === (params.get('plan') ?? 'basic'))
  const purchase = usePurchase(
    userId,
    storeId,
    (order) => {
      // Back/return should open this order without starting a second checkout.
      navigate(paymentPath(order.id), { replace: true })
      const checkout = resumableCheckoutUrl(order)
      if (checkout) window.location.assign(checkout)
    },
    result.reload,
  )

  if (data?.pending_order && !purchase.attempt && !purchase.pending) {
    return <Navigate to={paymentPath(data.pending_order.id)} replace />
  }

  const available =
    data?.billing_available && plan?.code === 'basic' && plan.catalog_status === 'published'
  return (
    <>
      <Link
        to="/subscription"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-forest"
      >
        <ArrowLeft size={16} /> Back to plans
      </Link>
      <PageHeader
        eyebrow="SUBSCRIPTION CHECKOUT"
        title="Make room for your store"
        description="Choose your duration, review the total, and continue to QR Ph payment."
      />
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {purchase.attempt && (!purchase.pending || purchase.recovering) ? (
        <PurchaseRecovery purchase={purchase} />
      ) : data && available && plan ? (
        <PurchaseForm
          key={`${plan.id}:${plan.version}`}
          plan={plan}
          pending={purchase.pending}
          error={purchase.error}
          onConfirm={(months) => void purchase.purchase(plan, months)}
        />
      ) : data ? (
        <section className="panel p-6" role="status">
          <h2 className="text-sm font-semibold text-forest">This checkout is unavailable</h2>
          <p className="mt-2 text-sm text-stone-500">
            {data.billing_available
              ? 'Choose a published Basic plan from the subscription page.'
              : 'Online payment is unavailable right now. Please try again later or contact your service administrator.'}
          </p>
          {purchase.error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {purchase.error.message}
            </p>
          )}
        </section>
      ) : null}
    </>
  )
}
