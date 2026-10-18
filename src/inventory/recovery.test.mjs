import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../testing/sourceModule.mjs'

const source = createSourceModule(import.meta.url)
const { createStockAdjustment, readStockAdjustment, persistStockAdjustment,
  removeStockAdjustment, stockAdjustmentStorageKey } = await import(await source('./recovery.ts'))
const requestKey = '41c149aa-79bb-42dc-9603-1599e5311ea5'
const product = { id: 3, name: 'Rice', unit: 'bag' }
const input = { product_id: 3, mode: 'add', quantity: 10, reason: 'New delivery' }

function memory() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('stock recovery preserves exact additions, removals and versioned counts across reload', () => {
  for (const mode of ['add', 'remove', 'set']) {
    const storage = memory()
    const attempt = createStockAdjustment(2, product, {
      ...input, mode, ...(mode === 'set' ? { quantity: 0, expected_version: 0 } : {}),
    }, requestKey)
    persistStockAdjustment(storage, 'pending', attempt)
    assert.deepEqual(readStockAdjustment(storage, 'pending', 2), attempt)
    persistStockAdjustment(storage, 'pending', attempt)
    assert.equal(readStockAdjustment(storage, 'pending', 2).input.request_key, requestKey)
  }
})

test('an unresolved adjustment cannot be replaced by different details or a new key', () => {
  const storage = memory()
  const attempt = createStockAdjustment(2, product, input, requestKey)
  persistStockAdjustment(storage, 'pending', attempt)
  for (const change of [
    { reason: 'Corrected reason' }, { quantity: 20 },
    { request_key: '51c149aa-79bb-42dc-9603-1599e5311ea5' },
  ]) assert.throws(() => persistStockAdjustment(storage, 'pending', {
    ...attempt, input: { ...attempt.input, ...change },
  }))
  assert.deepEqual(readStockAdjustment(storage, 'pending', 2), attempt)
})

test('recovery keys isolate users and stores; a foreign payload fails closed', () => {
  assert.notEqual(stockAdjustmentStorageKey(1, 2), stockAdjustmentStorageKey(2, 2))
  assert.notEqual(stockAdjustmentStorageKey(1, 2), stockAdjustmentStorageKey(1, 3))
  const storage = memory()
  persistStockAdjustment(storage, 'pending', createStockAdjustment(2, product, input, requestKey))
  assert.throws(() => readStockAdjustment(storage, 'pending', 3))
})

test('malformed or inaccessible recovery cannot silently become a new adjustment', () => {
  for (const raw of ['{invalid', '{}', 'null'])
    assert.throws(() => readStockAdjustment({ getItem: () => raw }, 'pending', 2))
  for (const change of [
    { quantity: 1.5 }, { quantity: 1000000001 }, { request_key: 'bad' },
    { mode: 'set' }, { reason: '' }, { product_id: 99 },
  ]) {
    const attempt = createStockAdjustment(2, product, input, requestKey)
    Object.assign(attempt.input, change)
    assert.throws(() => readStockAdjustment({ getItem: () => JSON.stringify(attempt) }, 'pending', 2))
  }
  assert.throws(() => readStockAdjustment({ getItem: () => { throw Error('Unavailable') } }, 'pending', 2))
  assert.equal(readStockAdjustment({ getItem: () => null }, 'pending', 2), null)
})

test('late cleanup cannot remove a different pending request and extra fields are not replayed', () => {
  const storage = memory()
  const attempt = createStockAdjustment(2, product, input, requestKey)
  storage.setItem('pending', JSON.stringify({ ...attempt, secret: 'ignored', input: { ...attempt.input, actor_id: 55 } }))
  assert.deepEqual(readStockAdjustment(storage, 'pending', 2), attempt)
  removeStockAdjustment(storage, 'pending', 'a-different-key')
  assert.ok(storage.getItem('pending'))
  removeStockAdjustment(storage, 'pending', requestKey)
  assert.equal(storage.getItem('pending'), null)
})
