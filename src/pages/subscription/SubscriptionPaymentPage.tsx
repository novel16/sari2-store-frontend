import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { useWorkspace } from '../../hooks/useWorkspace'
import { isOrderId } from '../../subscriptions/payments/checkout'
import PaymentOrderPanel from '../../subscriptions/payments/PaymentOrderPanel'

export default function SubscriptionPaymentPage() {
  const { user, store } = useWorkspace()
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const payment = params.get('payment')
  if (!user || !store) return null
  return (
    <>
      <Link
        to="/subscription"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-forest"
      >
        <ArrowLeft size={16} /> Back to subscription
      </Link>
      <PageHeader
        eyebrow="SUBSCRIPTION PAYMENT"
        title="Your payment status"
        description="Follow your payment and subscription activation here."
      />
      {payment === 'return' && (
        <p className="mb-5 rounded-xl bg-forest/5 p-4 text-sm text-forest" role="status">
          Welcome back. We are checking your payment confirmation.
        </p>
      )}
      {payment === 'back' && (
        <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">
          You returned from checkout. Check this order before starting another payment.
        </p>
      )}
      {isOrderId(orderId) ? (
        <PaymentOrderPanel
          key={`${user.id}:${store.id}:${orderId}`}
          orderId={orderId}
          storeId={store.id}
        />
      ) : (
        <p className="panel p-6 text-sm text-stone-500" role="alert">
          This payment reference is invalid. Open your payment history from the subscription page.
        </p>
      )}
    </>
  )
}
