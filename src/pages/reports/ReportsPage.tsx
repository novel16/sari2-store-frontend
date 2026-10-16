import { useWorkspace } from '../../hooks/useWorkspace'
import ReportsWorkspace from './ReportsWorkspace'

export default function ReportsPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <ReportsWorkspace key={`${user.id}:${store.id}`} storeId={store.id} />
  ) : null
}
