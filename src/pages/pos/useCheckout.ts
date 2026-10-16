import { useRef, useState } from 'react'
import axios from 'axios'
import { toApiError } from '../../api/errors'
import { AuthError } from '../../auth/errors'
import { useAuth } from '../../auth/useAuth'
import { salesApi } from '../../sales/api'
import type { SaleDetail } from '../../sales/types'
import { createAttempt, removeAttempt } from './recovery'
import type { CartLine, CheckoutAttempt } from './types'
import type { CustomerSelection } from '../../customers/types'

export function useCheckout(
  storeId: number,
  storageKey: string,
  initial: CheckoutAttempt | null,
  onSaved: () => void,
  onRejected: () => Promise<unknown>,
  draftKey: string,
) {
  const { refresh } = useAuth()
  const [attempt, setAttempt] = useState(initial)
  const [receipt, setReceipt] = useState<SaleDetail | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const busy = useRef(false)

  function forget(key: string) {
    setAttempt(null)
    try {
      removeAttempt(sessionStorage, storageKey, key)
    } catch {
      /* A saved sale remains recoverable by its existing key. */
    }
  }
  function saved(sale: SaleDetail, key: string) {
    try {
      sessionStorage.removeItem(draftKey)
    } catch {
      /* The saved sale remains authoritative. */
    }
    forget(key)
    setReceipt(sale)
    setError(null)
    onSaved()
  }

  async function submit(value: CheckoutAttempt) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError(null)
    try {
      saved((await salesApi.checkout(storeId, value.input)).data, value.input.idempotency_key)
    } catch (failure) {
      const next = toApiError(failure)
      setError(next)
      const conflict = axios.isAxiosError(failure) ? failure.response?.data?.code : undefined
      if ([404, 409, 422].includes(next.status ?? 0) && conflict !== 'idempotency_conflict') {
        forget(value.input.idempotency_key)
        await onRejected()
      }
      if (next.status === 401 || next.status === 403) await refresh()
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  async function complete(
    lines: CartLine[],
    discount: number,
    tendered: number,
    customer?: CustomerSelection,
  ) {
    if (busy.current || attempt) return
    const value = createAttempt(lines, discount, tendered, crypto.randomUUID(), customer)
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      setError(
        new AuthError(
          'This browser could not keep checkout recovery data. Allow session storage and try again.',
        ),
      )
      return
    }
    try {
      sessionStorage.removeItem(draftKey)
    } catch {
      /* Checkout recovery is already safely saved. */
    }
    setAttempt(value)
    await submit(value)
  }

  async function check() {
    if (!attempt || busy.current) return
    busy.current = true
    setPending(true)
    setError(null)
    try {
      saved(
        await salesApi.byKey(storeId, attempt.input.idempotency_key),
        attempt.input.idempotency_key,
      )
    } catch (failure) {
      const next = toApiError(failure)
      setError(
        next.status === 404
          ? new AuthError(
              'No saved sale was found yet. Retry the same checkout to finish or confirm it.',
              404,
            )
          : next,
      )
      if (next.status === 401 || next.status === 403) await refresh()
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return {
    attempt,
    receipt,
    pending,
    error,
    fields: error?.fields ?? {},
    complete,
    retry: () => (attempt ? submit(attempt) : Promise.resolve()),
    check,
    closeReceipt: () => setReceipt(null),
    clearError: () => setError(null),
  }
}
