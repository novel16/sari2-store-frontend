import type { AuthUser } from './types'

export function canAccessClient(user: AuthUser): boolean {
  return (
    user.platform_role === 'user' &&
    user.status === 'active' &&
    user.accounts.some(
      (account) =>
        account.role === 'owner' &&
        account.status === 'active' &&
        account.stores.some((store) => store.status === 'active'),
    )
  )
}
