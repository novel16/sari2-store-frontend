import { useWorkspace } from '../../hooks/useWorkspace'
import DashboardWorkspace from './DashboardWorkspace'

export default function DashboardPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <DashboardWorkspace key={`${user.id}:${store.id}`} storeId={store.id} name={user.name} />
  ) : null
}
