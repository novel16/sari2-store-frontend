import { useWorkspace } from '../../hooks/useWorkspace'
import SubscriptionWorkspace from './SubscriptionWorkspace'
export default function SubscriptionPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <SubscriptionWorkspace key={`${user.id}:${store.id}`} userId={user.id} storeId={store.id} />
  ) : null
}
