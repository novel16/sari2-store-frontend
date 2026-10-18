import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { catalogApi, storePath } from '../catalog/api'
import type { AdjustmentInput, Product } from '../catalog/types'
import { toApiError } from '../api/errors'
import { AuthError } from '../auth/errors'
import { useAuth } from '../auth/useAuth'
import {
  createStockAdjustment,
  persistStockAdjustment,
  readStockAdjustment,
  removeStockAdjustment,
  stockAdjustmentStorageKey,
  stockRecoveryMessage,
} from './recovery'
import type { StockAdjustmentAttempt } from './recovery'

export function useStockAdjustment(
  userId: number,
  storeId: number,
  onSaved: (productName: string) => void,
  onRejected: () => void,
) {
  const { refresh } = useAuth()
  const storageKey = stockAdjustmentStorageKey(userId, storeId)
  const [initial] = useState(() => {
    try {
      return { attempt: readStockAdjustment(sessionStorage, storageKey, storeId), blocked: false }
    } catch {
      return { attempt: null, blocked: true }
    }
  })
  const [attempt, setAttempt] = useState(initial.attempt)
  const current = useRef(initial.attempt)
  const [blocked, setBlocked] = useState(initial.blocked)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthError | null>(
    initial.blocked ? new AuthError(stockRecoveryMessage) : null,
  )
  const busy = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  function remember(value: StockAdjustmentAttempt | null) {
    current.current = value
    setAttempt(value)
  }

  async function submit(value: StockAdjustmentAttempt): Promise<boolean> {
    if (busy.current || blocked) return false
    // Persist before every send, including recovery after navigation. Never create
    // a replacement key or edit an unresolved operation.
    try {
      persistStockAdjustment(sessionStorage, storageKey, value)
    } catch {
      setBlocked(true)
      setError(new AuthError(stockRecoveryMessage))
      return false
    }
    busy.current = true
    setPending(true)
    setError(null)
    let confirmed = false
    try {
      await catalogApi.adjustStock(storeId, value.input)
      confirmed = true
    } catch (failure) {
      if (!mounted.current) return false
      const next = toApiError(failure)
      setError(next)
      const code = axios.isAxiosError(failure) ? failure.response?.data?.code : undefined
      const adjustmentResponse = axios.isAxiosError(failure) &&
        failure.config?.method?.toLowerCase() === 'post' &&
        failure.config?.url === storePath(storeId) + '/inventory/adjustments'
      // These responses are definitive rejections. Unknown conflicts, auth/network
      // failures and 5xx responses keep the exact attempt for safe replay.
      if (adjustmentResponse && (next.status === 422 ||
          (next.status === 409 && ['stock_changed', 'product_archived'].includes(code)))) {
        try {
          removeStockAdjustment(sessionStorage, storageKey, value.input.request_key)
          remember(null)
          onRejected()
        } catch {
          setBlocked(true)
          setError(new AuthError(stockRecoveryMessage))
        }
      }
      if (next.status === 401 || next.status === 403) await refresh()
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
    // A response arriving after navigation cannot acknowledge anything to the
    // user. Leave the original request available for the next mounted workspace.
    if (!confirmed || !mounted.current) return false
    try {
      removeStockAdjustment(sessionStorage, storageKey, value.input.request_key)
    } catch {
      setError(new AuthError(
        'The adjustment is saved, but this browser could not clear its recovery data. Retry the same adjustment to confirm it.',
      ))
      return false
    }
    remember(null)
    setError(null)
    onSaved(value.product.name)
    return true
  }

  async function start(product: Product, input: Omit<AdjustmentInput, 'request_key'>) {
    if (busy.current || current.current || blocked) return false
    if (!input.reason.trim()) {
      setError(new AuthError('Enter a reason for this adjustment.', 422, {
        reason: ['Enter a reason for this adjustment.'],
      }))
      return false
    }
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 0 || input.quantity > 1000000000 ||
        (input.mode !== 'set' && input.quantity === 0)) {
      setError(new AuthError('Enter a valid stock quantity.', 422, {
        quantity: ['Use a whole number between ' + (input.mode === 'set' ? '0' : '1') + ' and 1,000,000,000.'],
      }))
      return false
    }
    const value = createStockAdjustment(storeId, product, input, crypto.randomUUID())
    try {
      persistStockAdjustment(sessionStorage, storageKey, value)
    } catch {
      setBlocked(true)
      setError(new AuthError(stockRecoveryMessage))
      return false
    }
    remember(value)
    return submit(value)
  }

  return {
    attempt, pending, error, blocked,
    fields: error?.fields ?? {},
    start,
    retry: () => current.current ? submit(current.current) : Promise.resolve(false),
    clearError: () => setError(null),
  }
}

export type StockAdjustmentState = ReturnType<typeof useStockAdjustment>
