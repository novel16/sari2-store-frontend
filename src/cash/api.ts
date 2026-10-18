import { http, writeWithCsrf } from '../api/http'
import { storePath } from '../catalog/api'
import type { CashAttempt, CashDayResult, CashMovementResult, CloseReview } from './types'

export const cashPath = (storeId: number) => storePath(storeId) + '/cash-days'

export function cashActionPath(value: CashAttempt) {
  const base = cashPath(value.store_id)
  if (value.kind === 'open') return base
  return base + '/' + value.day_id + (value.kind === 'movement' ? '/movements' : '/close')
}

export const cashApi = {
  record(value: CashAttempt) {
    return value.kind === 'movement'
      ? writeWithCsrf<CashMovementResult>('post', cashActionPath(value), value.input)
      : writeWithCsrf<CashDayResult>('post', cashActionPath(value), value.input)
  },
  async byKey(value: CashAttempt) {
    const suffix =
      value.kind === 'open' ? '' : value.kind === 'movement' ? '/movements' : '/closings'
    return (
      await http.get<CashDayResult | CashMovementResult>(
        cashPath(value.store_id) + suffix + '/by-key/' + value.input.request_key,
      )
    ).data
  },
  async preview(storeId: number, dayId: number, counted: number, notes: string | null) {
    return (
      await writeWithCsrf<{ data: CloseReview }>(
        'post',
        cashPath(storeId) + '/' + dayId + '/close-preview',
        { counted_cash_centavos: counted, notes },
      )
    ).data
  },
}
