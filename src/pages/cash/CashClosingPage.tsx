import { useWorkspace } from '../../hooks/useWorkspace'
import CashClosingWorkspace from '../../cash/CashClosingWorkspace'

export default function CashClosingPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <CashClosingWorkspace key={user.id + ':' + store.id} userId={user.id} storeId={store.id} />
  ) : null
}
