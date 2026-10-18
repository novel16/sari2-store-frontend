import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../testing/sourceModule.mjs'

const source = createSourceModule(import.meta.url)
const recovery = await import(await source('./recovery.ts'))
const {
  createCashAttempt,
  readCashAttempt,
  persistCashAttempt,
  removeCashAttempt,
  cashStorageKey,
} = recovery
const key = '41c149aa-79bb-42dc-9603-1599e5311ea5'
const otherKey = '51c149aa-79bb-42dc-9603-1599e5311ea5'
const date = '2026-02-01'
const totals = {
  opening_cash_centavos: '10000',
  cash_sales_centavos: '5000',
  repayments_centavos: '3000',
  cash_refunds_centavos: '2000',
  cash_in_centavos: '1000',
  cash_out_centavos: '500',
  expected_cash_centavos: '16500',
  cash_sale_count: 2,
  repayment_count: 1,
  cash_refund_count: 1,
  movement_count: 2,
}
const review = {
  cash_day_id: 3,
  store_id: 2,
  business_date: date,
  totals,
  counted_cash_centavos: '16000',
  variance_centavos: '-500',
  notes: 'Cash shortage',
  review_token: 'signed-review-token',
  expires_at: '2026-02-01T12:00:00Z',
}
const inputs = [
  { kind: 'open', business_date: date, opening_cash_centavos: 10000, notes: null },
  {
    kind: 'movement',
    day: { id: 3, business_date: date },
    direction: 'out',
    amount_centavos: 500,
    reason: 'Bank deposit',
  },
  { kind: 'close', review },
]
function memory() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('every financial cash attempt preserves exact reviewed data and key across reload, including expired closing tokens', () => {
  for (const input of inputs) {
    const storage = memory()
    const attempt = createCashAttempt(1, 2, input, key)
    persistCashAttempt(storage, 'pending', attempt)
    assert.deepEqual(readCashAttempt(storage, 'pending', 1, 2), attempt)
    assert.equal(readCashAttempt(storage, 'pending', 1, 2).input.request_key, key)
    persistCashAttempt(storage, 'pending', attempt)
  }
  const opening = createCashAttempt(1, 2, inputs[0], key)
  assert.equal(opening.input.business_date, date, 'Opening retries pin the server business date')
})

test('cash recovery isolates users and stores and refuses edits to an unresolved request', () => {
  assert.notEqual(cashStorageKey(1, 2), cashStorageKey(2, 2))
  assert.notEqual(cashStorageKey(1, 2), cashStorageKey(1, 3))
  const storage = memory()
  const attempt = createCashAttempt(1, 2, inputs[1], key)
  persistCashAttempt(storage, 'pending', attempt)
  assert.throws(() => readCashAttempt(storage, 'pending', 2, 2))
  assert.throws(() => readCashAttempt(storage, 'pending', 1, 3))
  for (const changed of [
    { request_key: otherKey },
    { reason: 'Changed reason' },
    { amount_centavos: 600 },
  ])
    assert.throws(() =>
      persistCashAttempt(storage, 'pending', {
        ...attempt,
        input: { ...attempt.input, ...changed },
      }),
    )
  removeCashAttempt(storage, 'pending', otherKey)
  assert.ok(storage.getItem('pending'), 'A late response cannot clear a newer request')
  removeCashAttempt(storage, 'pending', key)
  assert.equal(storage.getItem('pending'), null)
})

test('malformed, mismatched and inaccessible cash recovery fail closed and injected payload fields are removed', () => {
  const storage = memory()
  for (const value of [
    '{bad json',
    {},
    {
      ...createCashAttempt(1, 2, inputs[0], key),
      input: {
        request_key: key,
        business_date: '2026-02-02',
        opening_cash_centavos: 100,
        notes: null,
      },
    },
    {
      ...createCashAttempt(1, 2, inputs[1], key),
      input: { request_key: key, direction: 'out', amount_centavos: 0, reason: '   ' },
    },
    { ...createCashAttempt(1, 2, inputs[2], key), review: { ...review, variance_centavos: '0' } },
  ]) {
    storage.setItem('pending', typeof value === 'string' ? value : JSON.stringify(value))
    assert.throws(() => readCashAttempt(storage, 'pending', 1, 2))
  }
  assert.throws(() =>
    readCashAttempt(
      {
        getItem() {
          throw Error('Storage denied')
        },
      },
      'pending',
      1,
      2,
    ),
  )
  const clean = createCashAttempt(1, 2, inputs[1], key)
  storage.setItem(
    'pending',
    JSON.stringify({ ...clean, input: { ...clean.input, store_id: 900, cash_day_id: 88 } }),
  )
  assert.deepEqual(readCashAttempt(storage, 'pending', 1, 2), clean)
})

test('cash counts and variance keep exact centavos, including totals above the safe integer range', async () => {
  const format = await source('../lib/format.ts')
  const money = await source('../reports/money.ts')
  const csv = await source('../lib/csv.ts')
  const { cashAmount, cashVariance, varianceText } = await import(
    await source('./format.ts', {
      '../lib/format': format,
      '../reports/money': money,
      '../lib/csv': csv,
    })
  )
  assert.equal(cashAmount('001.09'), 109)
  assert.equal(cashAmount('0'), 0)
  for (const text of ['-1', '0.001', '1e3', '', '10000000.01'])
    assert.throws(() => cashAmount(text))
  assert.throws(() => cashAmount('0', false))
  assert.equal(cashVariance('100', '9007199254740993'), '-9007199254740893')
  assert.match(varianceText('-500'), /Short by/)
  assert.match(varianceText('500'), /Over by/)
  assert.equal(varianceText('0'), 'Balanced')
})

test('invalid local attempts are rejected before persistence and cannot block a later valid change', () => {
  const storage = memory()
  const attempt = createCashAttempt(1, 2, inputs[1], key)
  for (const input of [
    { ...attempt.input, amount_centavos: 0 },
    { ...attempt.input, reason: '   ' },
  ]) {
    assert.throws(() => persistCashAttempt(storage, 'pending', { ...attempt, input }))
    assert.equal(storage.getItem('pending'), null)
  }
  persistCashAttempt(storage, 'pending', attempt)
  assert.deepEqual(readCashAttempt(storage, 'pending', 1, 2), attempt)
})
