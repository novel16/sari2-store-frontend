import { useRef, useState } from 'react'
import { toApiError } from '../api/errors'
import type { AuthError } from '../auth/errors'
import { useAuth } from '../auth/useAuth'

export function useMutation() {
  const { refresh } = useAuth()
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    if (busy.current) return false
    busy.current = true
    setPending(true)
    setError(null)
    try {
      await action()
      return true
    } catch (failure) {
      const next = toApiError(failure)
      setError(next)
      if (next.status === 401 || next.status === 403) await refresh()
      return false
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return { pending, error, fields: error?.fields ?? {}, run }
}
