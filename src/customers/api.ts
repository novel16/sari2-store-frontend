import { http, writeWithCsrf } from '../api/http'
import { storePath } from '../catalog/api'
import type { Customer, CustomerInput } from './types'
import type { RepaymentInput, RepaymentReply } from './repayments/types'

export const customersApi = {
  async show(storeId: number, customerId: number) {
    return (await http.get<{ data: Customer }>(`${storePath(storeId)}/customers/${customerId}`))
      .data
  },
  update: (storeId: number, customerId: number, input: Omit<CustomerInput, 'request_key'>) =>
    writeWithCsrf<{ data: Customer }>(
      'patch',
      `${storePath(storeId)}/customers/${customerId}`,
      input,
    ),
  status: (storeId: number, customerId: number, status: Customer['status']) =>
    writeWithCsrf<{ data: Customer }>(
      'patch',
      `${storePath(storeId)}/customers/${customerId}/status`,
      { status },
    ),
  create: (storeId: number, input: CustomerInput) =>
    writeWithCsrf<{ data: Customer }>('post', `${storePath(storeId)}/customers`, input),
  repay: (storeId: number, customerId: number, input: RepaymentInput) =>
    writeWithCsrf<RepaymentReply>(
      'post',
      `${storePath(storeId)}/customers/${customerId}/payments`,
      input,
    ),
  async repaymentByKey(storeId: number, customerId: number, key: string) {
    return (
      await http.get<RepaymentReply>(
        `${storePath(storeId)}/customers/${customerId}/payments/by-key/${encodeURIComponent(key)}`,
      )
    ).data
  },
}
