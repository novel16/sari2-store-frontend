import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../../testing/sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const format = await sourceModule('../../lib/format.ts')
const { cartReducer, cartTotals } = await import(
  await sourceModule('./cart.ts', { '../../lib/format': format })
)
const { createAttempt, readAttempt, removeAttempt, checkoutStorageKey } = await import(
  await sourceModule('./recovery.ts')
)
const { businessDate } = await import(await sourceModule('../../sales/format.ts'))
const product = {
  id: 7,
  name: 'Rice',
  description: null,
  unit: 'kg',
  price_centavos: 1525,
  status: 'active',
  inventory: { quantity_on_hand: 10, version: 1 },
  emoji: 'R',
  color: '#ffffff',
}
const line = { product, quantity: 2 }
const key = '41c149aa-79bb-42dc-9603-1599e5311ea5'

test('cart respects stock and removes individual lines without mutating catalog records', () => {
  let state = { lines: [], notice: '' }
  for (let index = 0; index < 11; index++) state = cartReducer(state, { type: 'add', product })
  assert.equal(state.lines[0].quantity, 10)
  assert.match(state.notice, /Only 10/)
  assert.equal(product.inventory.quantity_on_hand, 10)
  state = cartReducer(state, { type: 'quantity', id: 7, delta: -10 })
  assert.equal(state.lines.length, 0)
})

test('stale or archived lines can still be reduced and removed', () => {
  const stale = {
    lines: [
      {
        product: { ...product, status: 'archived', inventory: { quantity_on_hand: 0 } },
        quantity: 8,
      },
    ],
    notice: '',
  }
  const increased = cartReducer(stale, { type: 'quantity', id: 7, delta: 1 })
  assert.equal(increased.lines[0].quantity, 8)
  assert.equal(cartReducer(stale, { type: 'quantity', id: 7, delta: -1 }).lines[0].quantity, 7)
  assert.equal(cartTotals(stale.lines, '0', '500').valid, false)
})

test('cash totals use exact centavos for discount, payment, and change', () => {
  const totals = cartTotals([line], '1.05', '50')
  assert.deepEqual(
    [totals.subtotal, totals.discount, totals.total, totals.tendered, totals.change, totals.valid],
    [3050, 105, 2945, 5000, 2055, true],
  )
  assert.equal(cartTotals([line], '0', '30.49').valid, false)
  assert.equal(cartTotals([line], '30.51', '50').valid, false)
  assert.equal(cartTotals([line], '1.001', '50').valid, false)
  assert.equal(cartTotals([line], '0', '1e4').valid, false)
  assert.equal(cartTotals([], '0', '50').valid, false)
})

test('fully discounted sales accept zero cash while oversized totals are refused', () => {
  assert.equal(cartTotals([line], '30.50', '0').valid, true)
  assert.equal(
    cartTotals(
      [{ product: { ...product, price_centavos: 1000000000 }, quantity: 2 }],
      '0',
      '10000000',
    ).valid,
    false,
  )
})

test('checkout recovery preserves the exact submitted request across reloads', () => {
  const attempt = createAttempt([line], 105, 5000, key)
  const restored = readAttempt({ getItem: () => JSON.stringify(attempt) }, 'pending')
  assert.deepEqual(restored, attempt)
  assert.deepEqual(attempt.input.items, [
    { product_id: 7, quantity: 2, expected_unit_price_centavos: 1525 },
  ])
  assert.notEqual(checkoutStorageKey(1, 2), checkoutStorageKey(2, 2))
  assert.notEqual(checkoutStorageKey(1, 2), checkoutStorageKey(1, 3))
  assert.notEqual(attempt.lines[0].product.inventory, product.inventory)
})

test('corrupt or inconsistent checkout recovery cannot be submitted', () => {
  for (const text of ['null', '{broken', '{}'])
    assert.equal(readAttempt({ getItem: () => text }, 'pending'), null)
  for (const mutate of [
    (value) => {
      value.input.items[0].quantity = 5
    },
    (value) => {
      value.input.items[0].expected_unit_price_centavos = 1
    },
    (value) => {
      value.input.payment.method = 'credit'
    },
    (value) => {
      value.input.idempotency_key = 'invalid'
    },
    (value) => {
      value.lines[0].quantity = 0.5
    },
  ]) {
    const value = createAttempt([line], 0, 5000, key)
    mutate(value)
    assert.equal(readAttempt({ getItem: () => JSON.stringify(value) }, 'pending'), null)
  }
  assert.equal(
    readAttempt(
      {
        getItem: () => {
          throw new Error('blocked storage')
        },
      },
      'pending',
    ),
    null,
  )
})

test('late responses cannot erase a newer checkout recovery record', () => {
  let value = JSON.stringify(createAttempt([line], 0, 5000, key))
  const storage = {
    getItem: () => value,
    removeItem: () => {
      value = null
    },
  }
  removeAttempt(storage, 'pending', 'another-key')
  assert.ok(value)
  removeAttempt(storage, 'pending', key)
  assert.equal(value, null)
})

test('business dates use Manila even around the UTC midnight boundary', () => {
  assert.equal(businessDate(new Date('2026-10-15T15:59:59Z')), '2026-10-15')
  assert.equal(businessDate(new Date('2026-10-15T16:00:00Z')), '2026-10-16')
})

const customer = {
  id: 12,
  store_id: 2,
  name: 'Aling Linda',
  phone: '09123456789',
  status: 'active',
  balance_centavos: '9007199254740993',
}

test('utang requires a selected customer and never parses or records cash tendered', () => {
  assert.equal(cartTotals([line], '1.05', '', 'credit').valid, false)
  const totals = cartTotals([line], '1.05', 'not cash', 'credit', customer.id)
  assert.deepEqual([totals.total, totals.tendered, totals.change, totals.valid], [2945, 0, 0, true])
  assert.equal(cartTotals([line], '30.50', '', 'credit', customer.id).valid, false)
  assert.equal(cartTotals([line], '0', '', 'cash').valid, false)
})

test('utang recovery preserves customer identity and exact balance while omitting cash and private notes', () => {
  const attempt = createAttempt([line], 105, 0, key, { ...customer, notes: 'Private note' })
  assert.deepEqual(attempt.input.payment, { method: 'credit', customer_id: 12 })
  assert.equal(attempt.customer.notes, undefined)
  assert.equal(attempt.customer.balance_centavos, '9007199254740993')
  assert.deepEqual(readAttempt({ getItem: () => JSON.stringify(attempt) }, 'pending'), attempt)
  for (const mutate of [
    (value) => {
      value.input.payment.customer_id = 13
    },
    (value) => {
      delete value.customer
    },
    (value) => {
      value.customer.balance_centavos = -1
    },
    (value) => {
      value.customer.store_id = 0
    },
  ]) {
    const invalid = structuredClone(attempt)
    mutate(invalid)
    assert.equal(readAttempt({ getItem: () => JSON.stringify(invalid) }, 'pending'), null)
  }
})

test('downloaded utang summaries identify the customer without inventing cash received', async () => {
  const saleFormat = await sourceModule('../../sales/format.ts')
  const { summaryText } = await import(
    await sourceModule('../../sales/summaryText.ts', {
      '../lib/format': format,
      './format': saleFormat,
    })
  )
  const text = summaryText({
    store: { name: 'Store', address: null, phone: null },
    sale_number: 'S-1',
    completed_at: '2026-10-16T00:00:00Z',
    sold_by: { name: 'Owner' },
    payment_method: 'credit',
    customer,
    items: [
      {
        quantity: 2,
        product_name_snapshot: 'Rice',
        unit_price_centavos: 1525,
        unit_snapshot: 'kg',
        line_total_centavos: 3050,
      },
    ],
    subtotal_centavos: 3050,
    discount_centavos: 105,
    total_centavos: 2945,
    credit_amount_centavos: 2945,
    payment: null,
    credit: { balance_after_centavos: '9007199254743938' },
  })
  assert.ok(text.includes('Payment: Utang'))
  assert.ok(text.includes('Customer: Aling Linda'))
  assert.ok(text.includes('Added to utang: ₱29.45'))
  assert.ok(!text.includes('Cash received'))
})
