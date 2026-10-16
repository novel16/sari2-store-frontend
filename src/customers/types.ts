import type { PageResponse } from '../catalog/types'

export interface CustomerSelection {
  id: number
  store_id: number
  name: string
  phone: string | null
  status: 'active' | 'archived'
  balance_centavos: string
}

export interface Customer extends CustomerSelection {
  can_record_opening_balance: boolean
  notes: string | null
  created_at: string
}

export interface CustomerInput {
  request_key: string
  name: string
  phone: string | null
  notes: string | null
}

export interface CustomersPageResponse extends Omit<PageResponse<Customer>, 'meta'> {
  meta: Omit<PageResponse<Customer>['meta'], 'summary'> & {
    summary: {
      customers: number
      outstanding_centavos: string
      with_balance: number
      collections_centavos: string
    }
  }
}

export interface CreditEntry {
  id: number
  sale_id: number | null
  sale_number: string | null
  entry_type: 'charge' | 'payment' | 'reversal' | 'opening_balance'
  opening_number?: string | null
  reversal?: { reference: string; sale_id: number; sale_number: string } | null
  payment_number: string | null
  payment_method: 'cash' | null
  notes: string | null
  recorded_by: { id: number; name: string | null }
  customer: { id: number; name: string; phone: string | null } | null
  amount_centavos: number
  balance_before_centavos: string
  balance_after_centavos: string
  created_at: string
}

export interface CustomerLedgerResponse extends PageResponse<CreditEntry> {
  customer: Customer
}
