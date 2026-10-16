import type { PageResponse } from '../../catalog/types'
import type { CreditEntry, Customer } from '../types'

export interface CustomerStatement extends PageResponse<CreditEntry> {
  customer: Customer
  store: { id: number; name: string; address: string | null; phone: string | null }
  snapshot_id: number
  generated_at: string
  totals: {
    opening_centavos: string
    charges_centavos: string
    payments_centavos: string
    reversals_centavos: string
  }
}
