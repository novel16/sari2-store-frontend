import { useRef, useState } from 'react'
import axios from 'axios'
import { http, writeWithCsrf } from '../../api/http'
import { toApiError } from '../../api/errors'
import { AuthError } from '../../auth/errors'
import { useAuth } from '../../auth/useAuth'
import { storePath } from '../../catalog/api'
import { openingStorageKey, readOpening, removeOpening } from './recovery'
import type { OpeningAttempt } from './recovery'
import type { CustomerSelection } from '../types'
import type { RepaymentReply } from '../repayments/types'

export function useOpeningBalance(userId: number, storeId: number, onChanged: () => void) {
  const key = openingStorageKey(userId, storeId)
  const [attempt, setAttempt] = useState(() => {
    try {
      return readOpening(sessionStorage, key, storeId)
    } catch {
      return null
    }
  })
  const [pending, setPending] = useState(false),
    [error, setError] = useState<AuthError | null>(null),
    [receipt, setReceipt] = useState<RepaymentReply | null>(null)
  const busy = useRef(false),
    { refresh } = useAuth()
  async function submit(
    value: OpeningAttempt,
    lookup = false,
  ): Promise<'saved' | 'rejected' | 'uncertain'> {
    if (busy.current) return 'uncertain'
    busy.current = true
    setPending(true)
    setError(null)
    const path = `${storePath(storeId)}/customers/${value.customer_id}/opening-balance`
    try {
      const reply = lookup
        ? (await http.get<RepaymentReply>(`${path}/by-key/${value.input.request_key}`)).data
        : await writeWithCsrf<RepaymentReply>('post', path, value.input)
      if (reply.customer.id !== value.customer_id || reply.data.entry_type !== 'opening_balance')
        throw new AuthError(
          'The saved opening does not match this customer. Check the ledger.',
          409,
        )
      removeOpening(sessionStorage, key, value.input.request_key)
      setAttempt(null)
      setReceipt(reply)
      onChanged()
      return 'saved'
    } catch (failure) {
      const next = toApiError(failure),
        code = axios.isAxiosError(failure) ? failure.response?.data?.code : undefined
      setError(
        lookup && next.status === 404
          ? new AuthError(
              'No saved opening was found yet. Retry the same request to finish or confirm it.',
              404,
            )
          : next,
      )
      if (
        !lookup &&
        [404, 409, 422].includes(next.status ?? 0) &&
        code !== 'opening_key_conflict'
      ) {
        removeOpening(sessionStorage, key, value.input.request_key)
        setAttempt(null)
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
    customer: Pick<CustomerSelection, 'id' | 'name'>,
    amount: number,
    notes: string,
  ) {
    if (attempt || busy.current) return 'uncertain'
    const value: OpeningAttempt = {
      version: 1,
      store_id: storeId,
      customer_id: customer.id,
      customer_name: customer.name,
      input: { request_key: crypto.randomUUID(), amount_centavos: amount, notes: notes.trim() },
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      setError(
        new AuthError(
          'Allow session storage before recording opening utang so an uncertain save can be recovered.',
        ),
      )
      return 'rejected'
    }
    setAttempt(value)
    return submit(value)
  }
  return {
    attempt,
    pending,
    error,
    receipt,
    record,
    check: () => attempt && submit(attempt, true),
    retry: () => attempt && submit(attempt),
    reset: () => {
      setError(null)
      setReceipt(null)
    },
  }
}
export type OpeningState = ReturnType<typeof useOpeningBalance>
