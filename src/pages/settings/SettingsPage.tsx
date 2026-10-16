import { useWorkspace } from '../../hooks/useWorkspace'
import SettingsWorkspace from './SettingsWorkspace'

export default function SettingsPage() {
  const { user, store } = useWorkspace()
  return user && store ? (
    <SettingsWorkspace key={`${user.id}:${store.id}`} user={user} store={store} />
  ) : null
}
