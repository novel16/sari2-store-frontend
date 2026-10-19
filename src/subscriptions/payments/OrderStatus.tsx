import { useState } from 'react'
import { money } from '../../lib/format'
import { toApiError } from '../../api/errors'
import { paymentsApi } from './api'
import { orderMessage, paymentDate, safeCheckoutUrl } from './checkout'
import type { PaymentOrder } from './types'

export default function OrderStatus({
  order,
  storeId,
  checking,
  onRefresh,
  onChanged,
}: {
  order: PaymentOrder
  storeId: number
  checking: boolean
  onRefresh: () => void
  onChanged: () => void
}) {
  const [expiring, setExpiring] = useState(false)
  const [confirmExpire, setConfirmExpire] = useState(false)
  const [error, setError] = useState('')
  const checkout =
    order.can_resume && order.payment_status !== 'paid' ? safeCheckoutUrl(order.checkout_url) : null
  async function expire() {
    if (expiring) return
    setExpiring(true)
    setError('')
    try {
      await paymentsApi.expire(storeId, order.id)
      setConfirmExpire(false)
      onChanged()
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setExpiring(false)
    }
  }
  return (
    <section className="panel mt-5 p-5 sm:p-6" aria-label="Subscription payment status">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-forest" role="status">
            {orderMessage(order)}
          </h2>
          <p className="mt-2 text-xs text-stone-500">
            {order.plan.name} · {order.months} {order.months === 1 ? 'month' : 'months'} ·{' '}
            {money(order.amount_centavos)}
          </p>
        </div>
        <button className="btn btn-secondary" disabled={checking || expiring} onClick={onRefresh}>
          {checking ? 'Checking…' : 'Check payment status'}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-stone-500">
        Payment is confirmed by PayMongo and processed securely by our server. Closing or returning
        from checkout does not confirm payment.
      </p>
      {order.payment_status === 'paid' && order.fulfillment_status !== 'fulfilled' && (
        <p className="mt-3 text-xs font-semibold text-amber-800">
          Do not pay again. Keep this reference if you need help with activation.
        </p>
      )}
      {order.subscription && (
        <p className="mt-3 text-xs text-forest">
          Coverage: {paymentDate(order.subscription.starts_at)}
          {order.subscription.ends_at ? ` to ${paymentDate(order.subscription.ends_at)}` : ''} PHT.
        </p>
      )}
      {order.expires_at && order.payment_status !== 'paid' && (
        <p className="mt-2 text-xs text-stone-500">
          Checkout expires {paymentDate(order.expires_at)} PHT. If your QR expired, check this order
          before starting another payment.
        </p>
      )}
      <p className="mt-3 break-all text-[11px] text-stone-400">Order reference: {order.id}</p>
      {order.fulfillment_status === 'needs_attention' && (
        <p className="mt-3 text-xs text-amber-800">
          Contact your service administrator with this order reference. Your payment record stays
          available.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {checkout && (
          <a className="btn btn-primary" href={checkout} rel="noreferrer">
            Continue QR Ph payment
          </a>
        )}
        {order.can_resume && !checkout && (
          <p role="alert" className="text-xs text-amber-800">
            The checkout link is unavailable. Refresh this order or contact support.
          </p>
        )}
        {order.can_cancel && !confirmExpire && (
          <button
            className="btn btn-secondary"
            disabled={expiring}
            onClick={() => setConfirmExpire(true)}
          >
            Cancel unpaid checkout
          </button>
        )}
      </div>
      {confirmExpire && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <p>
            Cancel this checkout? We will confirm with PayMongo before allowing a replacement. If
            you already paid, check payment status first.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              className="btn btn-secondary"
              disabled={expiring}
              onClick={() => setConfirmExpire(false)}
            >
              Keep checkout
            </button>
            <button className="btn btn-primary" disabled={expiring} onClick={() => void expire()}>
              {expiring ? 'Checking cancellation…' : 'Confirm cancellation'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
