import { useWorkspace } from '../../hooks/useWorkspace'
import SubscriptionWorkspace from './SubscriptionWorkspace'
import { Navigate, useSearchParams } from 'react-router-dom'
import { isOrderId, paymentPath } from '../../subscriptions/payments/checkout'
export default function SubscriptionPage() {
  const { user, store } = useWorkspace()
  const [params] = useSearchParams()
  const order = params.get('order')
  // Existing PayMongo sessions still return to the previous subscription URL.
  if (isOrderId(order)) {
    const payment = params.get('payment')
    const query = payment === 'return' || payment === 'back' ? `?payment=${payment}` : ''
    return <Navigate to={`${paymentPath(order)}${query}`} replace />
  }
  return user && store ? (
    <SubscriptionWorkspace key={`${user.id}:${store.id}`} userId={user.id} storeId={store.id} />
  ) : null
}
