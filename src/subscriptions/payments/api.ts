import { http, writeWithCsrf } from '../../api/http'
import type { OrderReply, PurchaseInput } from './types'

export const ordersPath = (storeId: number) => `/api/v1/stores/${storeId}/subscription/orders`
export const paymentsApi = {
  create: (storeId: number, input: PurchaseInput) =>
    writeWithCsrf<OrderReply>('post', ordersPath(storeId), input),
  find: async (storeId: number, key: string) =>
    (await http.get<OrderReply>(`${ordersPath(storeId)}/by-key/${encodeURIComponent(key)}`)).data,
  expire: (storeId: number, orderId: string) =>
    writeWithCsrf<OrderReply>(
      'post',
      `${ordersPath(storeId)}/${encodeURIComponent(orderId)}/expire`,
    ),
}
