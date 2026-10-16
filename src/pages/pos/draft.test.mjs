import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../../testing/sourceModule.mjs'

const source = createSourceModule(import.meta.url)
const { readDraft, draftStorageKey, clearUserDrafts, hasDraft } = await import(
  await source('./draft.ts')
)
const key = draftStorageKey(1, 2)
const draft = {
  version: 1,
  store_id: 2,
  lines: [
    {
      quantity: 3,
      product: {
        id: 5,
        name: 'Rice',
        description: null,
        unit: 'piece',
        price_centavos: 1250,
        status: 'active',
        inventory: { quantity_on_hand: 10, version: 4 },
        emoji: 'R',
        color: '#ffffff',
      },
    },
  ],
  cash: '50',
  discount: '1.00',
  method: 'credit',
  customer: {
    id: 8,
    store_id: 2,
    name: 'Linda',
    phone: null,
    status: 'active',
    balance_centavos: '5000',
  },
}
const read = (value) => readDraft({ getItem: () => JSON.stringify(value) }, key, 2)

test('draft retains editable cash/utang order details separately from financial recovery', () => {
  assert.deepEqual(read(draft), draft)
  assert.notEqual(key, draftStorageKey(2, 2))
  assert.notEqual(key, draftStorageKey(1, 3))
  assert.equal(hasDraft(draft), true)
  assert.equal(
    hasDraft({ lines: [], cash: '', discount: '0.00', method: 'cash', customer: null }),
    false,
  )
})
test('draft parser refuses corrupt cross-store duplicate and oversized lines', () => {
  for (const value of [
    null,
    {},
    { ...draft, store_id: 3 },
    { ...draft, lines: [...draft.lines, ...draft.lines] },
    { ...draft, lines: [{ ...draft.lines[0], quantity: 1e9 + 1 }] },
    { ...draft, customer: { ...draft.customer, store_id: 3 } },
    { ...draft, cash: '1e3' },
  ])
    assert.equal(read(value), null)
  assert.equal(readDraft({ getItem: () => '{bad' }, key, 2), null)
})
test('draft accepts stale archived lines for removal but strips extra customer and product fields', () => {
  const value = structuredClone(draft)
  value.lines[0].product.status = 'archived'
  value.lines[0].product.inventory.quantity_on_hand = 0
  value.lines[0].product.secret = 'ignored'
  value.customer.notes = 'Private notes'
  value.customer.token = 'ignored'
  const restored = read(value)
  assert.equal(restored.lines[0].quantity, 3)
  assert.equal(restored.lines[0].product.status, 'archived')
  assert.equal(restored.lines[0].product.secret, undefined)
  assert.equal(restored.customer.notes, undefined)
  assert.equal(restored.customer.token, undefined)
})
test('explicit logout clears only this users drafts and keeps payment checkout and other user recovery', () => {
  const values = new Map([
    [key, 'draft'],
    [draftStorageKey(1, 3), 'draft2'],
    [draftStorageKey(4, 2), 'other'],
    ['sarisari:checkout:v1:1:2', 'checkout'],
    ['sarisari:opening:v1:1:2', 'opening'],
  ])
  clearUserDrafts(
    {
      get length() {
        return values.size
      },
      key: (index) => Array.from(values.keys())[index] ?? null,
      removeItem: (key) => values.delete(key),
    },
    1,
  )
  assert.equal(values.has(key), false)
  assert.equal(values.has(draftStorageKey(1, 3)), false)
  assert.equal(values.size, 3)
})
