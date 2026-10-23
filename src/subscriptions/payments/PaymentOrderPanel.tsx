import { useCallback, useEffect, useState } from 'react'
import { http } from '../../api/http'
import { QueryState } from '../../components/ui/QueryState'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { ordersPath } from './api'
import OrderStatus from './OrderStatus'
import type { OrderReply } from './types'

export default function PaymentOrderPanel({
  orderId,
  storeId,
}: {
  orderId: string
  storeId: number
}) {
  const [lastReply, setLastReply] = useState<OrderReply | null>(null)
  const load = useCallback(async (path: string, signal: AbortSignal) => {
    const response = (await http.get<OrderReply>(path, { signal })).data
    if (!signal.aborted) setLastReply(response)
    return response
  }, [])
  const result = useStoreQuery<OrderReply>(`${ordersPath(storeId)}/${orderId}`, load)
  const { reload } = result
  // Keep this order's last known status visible during a background check.
  const order = result.error ? undefined : (result.data ?? lastReply)?.data
  const settled = Boolean(
    order &&
    (order.fulfillment_status === 'fulfilled' ||
      order.fulfillment_status === 'needs_attention' ||
      ['expired', 'failed'].includes(order.payment_status)),
  )
  useEffect(() => {
    if (settled) return
    // Poll only our read-only order endpoint. A browser response never marks a payment paid.
    let checks = 0
    const timer = window.setInterval(() => {
      if (++checks <= 24) reload()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [orderId, settled, reload])
  return (
    <>
      {!order && <QueryState loading={result.isLoading} error={result.error} retry={reload} />}
      {order && (
        <OrderStatus
          key={order.id}
          order={order}
          storeId={storeId}
          checking={result.isLoading}
          onRefresh={reload}
          onChanged={reload}
        />
      )}
      <p className="mt-2 text-[11px] text-stone-400">
        Status checks run briefly while this page is open. Use Check payment status again if
        confirmation is delayed.
      </p>
    </>
  )
}
