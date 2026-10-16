import { useRef, useState } from 'react'
import axios from 'axios'
import { toApiError } from '../../api/errors'
import { AuthError } from '../../auth/errors'
import { useAuth } from '../../auth/useAuth'
import { customersApi } from '../api'
import type { CustomerSelection } from '../types'
import { createRepayment, readRepayment, removeRepayment, repaymentStorageKey } from './recovery'
import type { RepaymentAttempt, RepaymentOutcome, RepaymentReply } from './types'

export function useRepayment(userId: number, storeId: number, onChanged: () => void) {
  const storageKey = repaymentStorageKey(userId, storeId)
  const [attempt, setAttempt] = useState<RepaymentAttempt | null>(() => {
    try {
      return readRepayment(sessionStorage, storageKey, storeId)
    } catch {
      return null
    }
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [receipt, setReceipt] = useState<RepaymentReply | null>(null)
  const [revision, setRevision] = useState(0)
  const busy = useRef(false)
  const { refresh } = useAuth()

  function forget(key: string) {
    setAttempt(null)
    try {
      removeRepayment(sessionStorage, storageKey, key)
    } catch {
      /* The saved payment stays recoverable from history. */
    }
  }
  function saved(reply: RepaymentReply, key: string) {
    forget(key)
    setError(null)
    setReceipt(reply)
    setRevision((value) => value + 1)
    onChanged()
  }
  async function submit(value: RepaymentAttempt): Promise<RepaymentOutcome> {
    if (busy.current) return 'busy'
    busy.current = true
    setPending(true)
    setError(null)
    try {
      saved(
        await customersApi.repay(storeId, value.customer.id, value.input),
        value.input.request_key,
      )
      return 'saved'
    } catch (failure) {
      const next = toApiError(failure)
      setError(next)
      const code = axios.isAxiosError(failure) ? failure.response?.data?.code : undefined
      if ([404, 409, 422].includes(next.status ?? 0) && code !== 'repayment_key_conflict') {
        forget(value.input.request_key)
        setRevision((current) => current + 1)
        onChanged()
        return 'rejected'
      }
      if (next.status === 401 || next.status === 403) await refresh()
      return 'uncertain'
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  async function record(
    customer: CustomerSelection,
    amount: number,
    notes: string,
  ): Promise<RepaymentOutcome> {
    if (busy.current || attempt) return 'busy'
    const value = createRepayment(customer, amount, notes, crypto.randomUUID())
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      setError(
        new AuthError(
          'This browser could not keep payment recovery data. Allow session storage and try again.',
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
      saved(
        await customersApi.repaymentByKey(storeId, attempt.customer.id, attempt.input.request_key),
        attempt.input.request_key,
      )
    } catch (failure) {
      const next = toApiError(failure)
      setError(
        next.status === 404
          ? new AuthError(
              'No saved payment was found yet. Retry the same payment to finish or confirm it.',
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
    revision,
    record,
    check,
    retry: () => (attempt ? submit(attempt) : Promise.resolve<RepaymentOutcome>('busy')),
    clearError: () => setError(null),
    closeReceipt: () => setReceipt(null),
  }
}

export type RepaymentState = ReturnType<typeof useRepayment>
