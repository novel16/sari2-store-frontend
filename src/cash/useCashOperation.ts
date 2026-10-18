import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toApiError } from '../api/errors'
import { AuthError } from '../auth/errors'
import { useAuth } from '../auth/useAuth'
import { cashActionPath, cashApi } from './api'
import {
  cashRecoveryMessage,
  cashStorageKey,
  createCashAttempt,
  persistCashAttempt,
  readCashAttempt,
  removeCashAttempt,
} from './recovery'
import type { CashAttempt, CashResult, NewCashAttempt } from './types'

const rejectionCodes = new Set([
  'cash_date_changed',
  'cash_day_exists',
  'cash_day_closed',
  'cash_day_not_today',
  'cash_insufficient_cash',
  'cash_review_expired',
  'cash_activity_changed',
  'cash_review_invalid',
  'cash_total_overflow',
])
export type CashOutcome = 'saved' | 'rejected' | 'uncertain'

export function useCashOperation(
  userId: number,
  storeId: number,
  onChanged: (result?: CashResult) => void,
) {
  const storageKey = cashStorageKey(userId, storeId)
  const { refresh } = useAuth()
  const [initial] = useState(() => {
    try {
      return {
        attempt: readCashAttempt(sessionStorage, storageKey, userId, storeId),
        blocked: false,
      }
    } catch {
      return { attempt: null, blocked: true }
    }
  })
  const [attempt, setAttempt] = useState(initial.attempt)
  const current = useRef(initial.attempt)
  const [blocked, setBlocked] = useState(initial.blocked)
  const [pending, setPending] = useState(false)
  const [rejectionRevision, setRejectionRevision] = useState(0)
  const [rejectedAttempt, setRejectedAttempt] = useState<CashAttempt | null>(null)
  const [error, setError] = useState<AuthError | null>(
    initial.blocked ? new AuthError(cashRecoveryMessage) : null,
  )
  const busy = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  function remember(value: CashAttempt | null) {
    current.current = value
    setAttempt(value)
  }
  function forget(value: CashAttempt) {
    removeCashAttempt(sessionStorage, storageKey, value.input.request_key)
    remember(null)
  }
  async function submit(value: CashAttempt, lookup = false): Promise<CashOutcome> {
    if (busy.current || blocked) return 'uncertain'
    try {
      persistCashAttempt(sessionStorage, storageKey, value)
    } catch {
      setBlocked(true)
      setError(new AuthError(cashRecoveryMessage))
      return 'uncertain'
    }
    busy.current = true
    setPending(true)
    setError(null)
    let reply: CashResult | undefined
    try {
      reply = await (lookup ? cashApi.byKey(value) : cashApi.record(value))
      const day = 'day' in reply ? reply.day : reply.data
      if (
        day.store_id !== storeId ||
        day.business_date !== value.business_date ||
        (value.kind !== 'open' && day.id !== value.day_id)
      )
        throw new AuthError(
          'The saved cash change does not match this day. Check cash history before continuing.',
          409,
        )
    } catch (failure) {
      if (!mounted.current) return 'uncertain'
      const next = toApiError(failure)
      setError(
        lookup && next.status === 404
          ? new AuthError(
              'No saved cash change was found yet. Retry the exact saved request to finish or confirm it.',
              404,
            )
          : next,
      )
      const code = axios.isAxiosError(failure) ? failure.response?.data?.code : undefined
      const actionResponse =
        axios.isAxiosError(failure) &&
        failure.config?.method?.toLowerCase() === 'post' &&
        failure.config?.url === cashActionPath(value)
      if (
        !lookup &&
        actionResponse &&
        (next.status === 422 || (next.status === 409 && rejectionCodes.has(code)))
      ) {
        try {
          forget(value)
          setRejectedAttempt(value)
          setRejectionRevision((revision) => revision + 1)
          onChanged()
          return 'rejected'
        } catch {
          setBlocked(true)
          setError(new AuthError(cashRecoveryMessage))
        }
      }
      if (next.status === 401 || next.status === 403) await refresh()
      return 'uncertain'
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
    // A late response cannot acknowledge a save to a user who already left.
    if (!mounted.current) return 'uncertain'
    try {
      forget(value)
    } catch {
      setError(
        new AuthError(
          'This cash change is saved, but recovery data could not be cleared. Retry the same request to confirm it.',
        ),
      )
      return 'uncertain'
    }
    setError(null)
    onChanged(reply)
    return 'saved'
  }
  async function start(input: NewCashAttempt): Promise<CashOutcome> {
    if (busy.current || current.current || blocked) return 'uncertain'
    let value: CashAttempt
    try {
      value = createCashAttempt(userId, storeId, input, crypto.randomUUID())
      // Validate before persisting; invalid local input must not poison recovery.
      value = readCashAttempt(
        { getItem: () => JSON.stringify(value) },
        storageKey,
        userId,
        storeId,
      )!
      persistCashAttempt(sessionStorage, storageKey, value)
    } catch {
      setError(
        new AuthError(
          'Cash details could not be saved for recovery. Check the amounts and allow session storage before trying again.',
        ),
      )
      return 'rejected'
    }
    setRejectedAttempt(null)
    remember(value)
    return submit(value)
  }
  return {
    attempt,
    blocked,
    pending,
    error,
    rejectionRevision,
    rejectedAttempt,
    start,
    retry: () =>
      current.current ? submit(current.current) : Promise.resolve<CashOutcome>('uncertain'),
    check: () =>
      current.current ? submit(current.current, true) : Promise.resolve<CashOutcome>('uncertain'),
    clearError: () => setError(null),
  }
}
export type CashOperation = ReturnType<typeof useCashOperation>
