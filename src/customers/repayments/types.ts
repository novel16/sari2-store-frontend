import type { CreditEntry, Customer, CustomerSelection } from '../types'

export interface RepaymentInput {
  request_key: string
  method: 'cash'
  amount_centavos: number
  expected_balance_centavos: string
  notes: string | null
}

export interface RepaymentAttempt {
  version: 1
  customer: CustomerSelection
  input: RepaymentInput
}

export interface RepaymentReply {
  data: CreditEntry
  customer: Customer
  meta?: { replayed: boolean }
}

export type RepaymentOutcome = 'saved' | 'rejected' | 'uncertain' | 'busy'
