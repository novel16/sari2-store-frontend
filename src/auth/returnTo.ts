const storeRoutes = new Set([
  '/dashboard',
  '/pos',
  '/products',
  '/categories',
  '/inventory',
  '/sales',
  '/customers',
  '/reports',
  '/subscription',
  '/settings',
])

export function safeReturnTo(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    Array.from(value).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  )
    return '/dashboard'
  try {
    const url = new URL(value, 'http://local.invalid')
    if (url.origin !== 'http://local.invalid' || !storeRoutes.has(url.pathname)) return '/dashboard'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/dashboard'
  }
}

export function returnToFromState(state: unknown): string {
  return state && typeof state === 'object' && 'returnTo' in state
    ? safeReturnTo(state.returnTo)
    : '/dashboard'
}
