import { useRef, useState } from 'react'
import { toAuthError } from './errors'
import type { AuthError } from './errors'

export function useAuthForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const submitting = useRef(false)

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    if (submitting.current) return false
    submitting.current = true
    setPending(true)
    setError(null)
    try {
      await action()
      return true
    } catch (failure) {
      setError(toAuthError(failure))
      return false
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return { pending, error, fields: error?.fields ?? {}, run }
}
