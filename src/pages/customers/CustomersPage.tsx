import { useWorkspace } from '../../hooks/useWorkspace'
import CustomersWorkspace from './CustomersWorkspace'

export default function CustomersPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <CustomersWorkspace key={`${user.id}:${store.id}`} userId={user.id} storeId={store.id} />
  ) : null
}
