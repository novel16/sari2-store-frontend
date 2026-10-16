import { useEffect, useState } from 'react'
import { hasDraft } from './draft'
import type { PosDraft } from './draft'

export function useDraftPersistence(key: string, draft: PosDraft, checkoutActive: boolean) {
  const [error, setError] = useState('')
  const serialized = JSON.stringify(draft)
  useEffect(() => {
    // Checkout recovery owns the order once it is submitted.
    if (checkoutActive) return
    const value = JSON.parse(serialized) as PosDraft
    const dirty = hasDraft(value)
    let message = ''
    try {
      if (dirty) sessionStorage.setItem(key, serialized)
      else sessionStorage.removeItem(key)
    } catch {
      // A browser storage failure must be visible before the user leaves POS.
      if (dirty)
        message =
          'Your browser could not save this draft. Keep this page open until checkout, or allow session storage.'
    }
    queueMicrotask(() => setError(message))
  }, [key, serialized, checkoutActive])
  useEffect(() => {
    if (!error) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [error])
  return error
}
