import { useAuth } from '../auth/useAuth'

export function useWorkspace() {
  const { user } = useAuth()
  const account = user?.accounts.find(
    (item) =>
      item.status === 'active' &&
      item.role === 'owner' &&
      item.stores.some((store) => store.status === 'active'),
  )
  const store = account?.stores.find((item) => item.status === 'active')
  const initials = (user?.name ?? 'Store Owner')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return { user, account, store, initials }
}
