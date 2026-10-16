import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../../testing/sourceModule.mjs'
const sourceModule = createSourceModule(import.meta.url)
const { readReversal, removeReversal, reversalStorageKey } = await import(
  await sourceModule('./recovery.ts')
)
const storage = () => {
  const data = new Map()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}
const valid = () => ({
  version: 1,
  store_id: 2,
  sale_id: 9,
  sale_number: 'S-2026-00000009',
  input: {
    request_key: '12345678-1234-1234-1234-123456789abc',
    kind: 'refund',
    reason: 'Returned unopened',
    restock: true,
    expected_balance_centavos: '9007199254740993',
    cash_confirmed: true,
  },
})
test('reversal recovery preserves reviewed balance and exact request with per-user/store isolation', () => {
  const data = storage(),
    key = reversalStorageKey(1, 2),
    value = valid()
  data.setItem(key, JSON.stringify(value))
  assert.deepEqual(readReversal(data, key, 2), value)
  assert.equal(readReversal(data, reversalStorageKey(3, 2), 2), null)
  assert.equal(readReversal(data, key, 3), null)
})
test('corrupt reversal recovery cannot submit arbitrary money or malformed requests', () => {
  const data = storage(),
    key = 'key'
  for (const change of [
    { kind: 'partial' },
    { restock: 'yes' },
    { reason: '' },
    { expected_balance_centavos: 9007199254740993 },
    { request_key: 'bad' },
  ]) {
    const value = valid()
    Object.assign(value.input, change)
    data.setItem(key, JSON.stringify(value))
    assert.equal(readReversal(data, key, 2), null)
  }
  const value = valid()
  value.input.cash_refund_centavos = 9000
  data.setItem(key, JSON.stringify(value))
  assert.equal(readReversal(data, key, 2).input.cash_refund_centavos, undefined)
})
test('late reversal responses cannot delete a newer pending request', () => {
  const data = storage(),
    value = valid()
  data.setItem('key', JSON.stringify(value))
  removeReversal(data, 'key', 'another-request')
  assert.ok(data.getItem('key'))
  removeReversal(data, 'key', value.input.request_key)
  assert.equal(data.getItem('key'), null)
})
