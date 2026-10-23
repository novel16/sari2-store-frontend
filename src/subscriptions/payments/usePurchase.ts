import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toApiError } from '../../api/errors'
import { AuthError } from '../../auth/errors'
import { useAuth } from '../../auth/useAuth'
import type { Plan } from '../types'
import { paymentsApi } from './api'
import { purchaseStorageKey, readPurchase } from './recovery'
import type { PaymentOrder, PurchaseInput } from './types'

export function usePurchase(
  userId: number,
  storeId: number,
  onCreated: (order: PaymentOrder) => void,
  onRejected?: () => void,
) {
  const key = purchaseStorageKey(userId, storeId)
  const [attempt, setAttempt] = useState<PurchaseInput | null>(() => {
    try {
      return readPurchase(sessionStorage, key)
    } catch {
      return null
    }
  })
  const [pending, setPending] = useState(false)
  const [recovering, setRecovering] = useState(Boolean(attempt))
  const [error, setError] = useState<AuthError | null>(null)
  const busy = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const { refresh } = useAuth()
  function forget() {
    setAttempt(null)
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* Server history still keeps confirmed orders. */
    }
  }
  async function submit(value: PurchaseInput, lookup: boolean) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError(null)
    try {
      // Retrying a lost response must use the original key and saved plan version.
      const response = lookup
        ? await paymentsApi.find(storeId, value.request_key)
        : await paymentsApi.create(storeId, value)
      // Leaving the page keeps an in-flight purchase recoverable without navigating away again.
      if (!mounted.current) return
      forget()
      onCreated(response.data)
    } catch (failure) {
      if (!mounted.current) return
      const next = toApiError(failure)
      const code = axios.isAxiosError(failure) ? failure.response?.data?.code : undefined
      setError(
        next.status === 404 && lookup
          ? new AuthError(
              'No saved order was found yet. Retry the same checkout below; this keeps the original request key.',
            )
          : next,
      )
      if (
        !lookup &&
        (next.status === 422 ||
          [
            'subscription_offer_changed',
            'subscription_checkout_pending',
            'billing_not_configured',
          ].includes(code))
      ) {
        forget()
        onRejected?.()
      }
      if (next.status === 401 || next.status === 403) await refresh()
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }
  async function purchase(plan: Plan, months: number) {
    if (attempt || busy.current) return
    setRecovering(false)
    const value = {
      request_key: crypto.randomUUID(),
      plan_id: plan.id,
      expected_plan_version: plan.version,
      months,
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      setError(
        new AuthError('Allow session storage to keep this checkout recoverable, then try again.'),
      )
      return
    }
    setAttempt(value)
    await submit(value, false)
  }
  return {
    attempt,
    pending,
    recovering,
    error,
    purchase,
    check: () => {
      setRecovering(true)
      return attempt && submit(attempt, true)
    },
    retry: () => {
      setRecovering(true)
      return attempt && submit(attempt, false)
    },
  }
}

export type PurchaseState = ReturnType<typeof usePurchase>
