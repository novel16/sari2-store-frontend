import type { SubscriptionReply } from './types'

export function renewalState(
  current: SubscriptionReply['data']['current'],
  renewal: SubscriptionReply['data']['renewal'],
  now = Date.now(),
): 'scheduled' | 'expired' | 'expiring' | 'active' | 'free' {
  if (renewal.next_period) return 'scheduled'
  if (current.plan.code === 'free') return renewal.last_paid_ended_at ? 'expired' : 'free'
  if (current.ends_at) {
    const remaining = new Date(current.ends_at).getTime() - now
    if (remaining <= 0) return 'expired'
    if (remaining <= 7 * 24 * 60 * 60 * 1000) return 'expiring'
  }
  return 'active'
}
