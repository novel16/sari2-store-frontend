import type { PaymentOrder } from './types'

export function safeCheckoutUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    // Payment navigation is limited to PayMongo's hosted checkout, even when API data is malformed.
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'checkout.paymongo.com' ||
      url.port ||
      url.username ||
      url.password
    )
      return null
    return url.href
  } catch {
    return null
  }
}

export const isOrderId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)

export const purchasePath = (planCode = 'basic') =>
  `/subscription/checkout?plan=${encodeURIComponent(planCode)}`

export const paymentPath = (orderId: string) =>
  `/subscription/payments/${encodeURIComponent(orderId)}`

export function resumableCheckoutUrl(order: PaymentOrder): string | null {
  return order.can_resume &&
    ['pending', 'creating', 'unknown'].includes(order.payment_status) &&
    order.fulfillment_status === 'pending'
    ? safeCheckoutUrl(order.checkout_url)
    : null
}

export const paymentDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
      }).format(new Date(value))
    : '—'

export function orderMessage(order: PaymentOrder) {
  if (order.fulfillment_status === 'fulfilled')
    return order.subscription && new Date(order.subscription.starts_at).getTime() > Date.now()
      ? 'Renewal scheduled'
      : 'Subscription activated'
  if (order.fulfillment_status === 'needs_attention')
    return order.payment_status === 'paid'
      ? 'Payment received; activation needs attention'
      : 'Checkout needs attention'
  if (order.payment_status === 'paid') return 'Payment received; activation processing'
  if (order.payment_status === 'expired') return 'Checkout expired'
  if (order.payment_status === 'failed') return 'Checkout could not be completed'
  if (order.payment_status === 'unknown' || order.payment_status === 'creating')
    return 'Checking checkout status'
  return 'Waiting for payment confirmation'
}
