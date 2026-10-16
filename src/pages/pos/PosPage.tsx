import { useWorkspace } from '../../hooks/useWorkspace'
import PosWorkspace from './PosWorkspace'

export default function PosPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <PosWorkspace
      key={`${user.id}:${store.id}`}
      userId={user.id}
      storeId={store.id}
      storeName={store.name}
      ownerName={user.name}
    />
  ) : null
}
