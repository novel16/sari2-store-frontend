import { useRef, useState } from 'react'
import axios from 'axios'
import { toApiError } from '../../api/errors'
import { AuthError } from '../../auth/errors'
import { useAuth } from '../../auth/useAuth'
import { reversalApi } from './api'
import { readReversal, removeReversal, reversalStorageKey } from './recovery'
import type { ReversalAttempt, ReversalInput, ReversalQuote, ReversalReply } from './types'

export function useReversal(userId: number, storeId: number, onSaved: () => void) {
  const key = reversalStorageKey(userId, storeId)
  const [attempt, setAttempt] = useState(() => {
    try {
      return readReversal(sessionStorage, key, storeId)
    } catch {
      return null
    }
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [receipt, setReceipt] = useState<ReversalReply | null>(null)
  const busy = useRef(false)
  const { refresh } = useAuth()
  function forget(value: ReversalAttempt) {
    try {
      removeReversal(sessionStorage, key, value.input.request_key)
    } catch {
      /* History remains available. */
    }
    setAttempt(null)
  }
  function saved(reply: ReversalReply, value: ReversalAttempt) {
    if (reply.data.id !== value.sale_id)
      throw new AuthError(
        'The saved reversal does not match this sale. Check sales history before continuing.',
        409,
      )
    forget(value)
    setReceipt(reply)
    setError(null)
    onSaved()
  }
  async function submit(value: ReversalAttempt): Promise<'saved' | 'rejected' | 'uncertain'> {
    if (busy.current) return 'uncertain'
    busy.current = true
    setPending(true)
    setError(null)
    try {
      saved(await reversalApi.record(storeId, value.sale_id, value.input), value)
      return 'saved'
    } catch (failure) {
      const next = toApiError(failure)
      setError(next)
      const code = axios.isAxiosError(failure) ? failure.response?.data?.code : undefined
      if ([404, 409, 422].includes(next.status ?? 0) && code !== 'reversal_key_conflict') {
        forget(value)
        return 'rejected'
      }
      if (next.status === 401 || next.status === 403) await refresh()
      return 'uncertain'
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  async function record(quote: ReversalQuote, input: Omit<ReversalInput, 'request_key'>) {
    if (attempt || busy.current) return 'uncertain'
    const value: ReversalAttempt = {
      version: 1,
      store_id: storeId,
      sale_id: quote.sale_id,
      sale_number: quote.sale_number,
      input: { ...input, request_key: crypto.randomUUID() },
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      setError(
        new AuthError(
          'Allow session storage so this refund can be recovered safely before trying again.',
        ),
      )
      return 'rejected'
    }
    setAttempt(value)
    return submit(value)
  }
  async function check() {
    if (!attempt || busy.current) return
    busy.current = true
    setPending(true)
    setError(null)
    try {
      saved(await reversalApi.byKey(storeId, attempt.input.request_key), attempt)
    } catch (failure) {
      const next = toApiError(failure)
      setError(
        next.status === 404
          ? new AuthError(
              'No saved reversal was found yet. Retry the same request to finish or confirm it.',
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
    pending,
    error,
    receipt,
    record,
    check,
    retry: () => attempt && submit(attempt),
    clearError: () => setError(null),
    closeReceipt: () => setReceipt(null),
  }
}
export type ReversalState = ReturnType<typeof useReversal>
