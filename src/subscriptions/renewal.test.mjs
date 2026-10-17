import assert from 'node:assert/strict'
import test from 'node:test'
import { createSourceModule } from '../testing/sourceModule.mjs'
const sourceModule = createSourceModule(import.meta.url)
const { renewalState } = await import(await sourceModule('./renewal.ts'))

test('renewal status distinguishes Free, expired, expiring, active, and scheduled periods', () => {
  const now = Date.parse('2026-10-16T04:00:00Z'),
    current = { plan: { code: 'basic' }, ends_at: '2026-11-16T04:00:00Z' },
    renewal = { next_period: null, last_paid_ended_at: null }
  assert.equal(renewalState(current, renewal, now), 'active')
  assert.equal(
    renewalState({ ...current, ends_at: '2026-10-23T04:00:00Z' }, renewal, now),
    'expiring',
  )
  assert.equal(
    renewalState({ ...current, ends_at: '2026-10-16T04:00:00Z' }, renewal, now),
    'expired',
  )
  const free = { plan: { code: 'free' }, ends_at: null }
  assert.equal(renewalState(free, renewal, now), 'free')
  assert.equal(
    renewalState(free, { ...renewal, last_paid_ended_at: '2026-10-15T04:00:00Z' }, now),
    'expired',
  )
  assert.equal(
    renewalState(current, { ...renewal, next_period: { starts_at: current.ends_at } }, now),
    'scheduled',
  )
})
