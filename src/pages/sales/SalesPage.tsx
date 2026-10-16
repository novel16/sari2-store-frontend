import { useWorkspace } from '../../hooks/useWorkspace'
import SalesWorkspace from './SalesWorkspace'

export default function SalesPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <SalesWorkspace key={`${user.id}:${store.id}`} userId={user.id} storeId={store.id} />
  ) : null
}
