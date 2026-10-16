import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../testing/sourceModule.mjs'

const source = createSourceModule(import.meta.url),
  format = await source('../lib/format.ts'),
  dates = await source('../sales/format.ts')
const { readOpening, removeOpening, openingStorageKey } = await import(
  await source('./opening/recovery.ts')
)
const { statementRows, statementText, decreasesBalance } = await import(
  await source('./statements/format.ts', {
    '../../lib/format': format,
    '../../sales/format': dates,
  })
)
const { paymentSlipText } = await import(
  await source('./repayments/paymentSlip.ts', {
    '../../lib/format': format,
    '../../sales/format': dates,
  })
)
const opening = {
  version: 1,
  store_id: 2,
  customer_id: 7,
  customer_name: 'Linda',
  input: {
    request_key: '41c149aa-79bb-42dc-9603-1599e5311ea5',
    amount_centavos: 5000,
    notes: 'Notebook balance',
  },
}
const key = openingStorageKey(1, 2)
const base = {
  id: 1,
  sale_id: null,
  sale_number: null,
  entry_type: 'opening_balance',
  opening_number: 'OPEN-00000001',
  payment_number: null,
  payment_method: null,
  notes: 'Notebook balance',
  recorded_by: { id: 1, name: 'Original owner' },
  customer: { id: 7, name: 'Original customer', phone: '09123456789' },
  amount_centavos: 5000,
  balance_before_centavos: '0',
  balance_after_centavos: '5000',
  created_at: '2026-10-16T00:00:00Z',
}
const payment = {
  ...base,
  id: 2,
  entry_type: 'payment',
  opening_number: null,
  payment_number: 'PAY-00000002',
  payment_method: 'cash',
  amount_centavos: 1000,
  balance_before_centavos: '5000',
  balance_after_centavos: '4000',
  notes: 'Partial payment',
}
const statement = {
  data: [base, payment],
  meta: { last_page: 2, total: 2 },
  customer: { id: 7, name: 'Updated customer', phone: null, balance_centavos: '4000' },
  store: { id: 2, name: 'Store' },
  snapshot_id: 2,
  generated_at: '2026-10-16T01:00:00Z',
  totals: {
    opening_centavos: '5000',
    charges_centavos: '0',
    payments_centavos: '1000',
    reversals_centavos: '0',
  },
}

test('opening recovery retains the exact reviewed request and strips injected financial fields', () => {
  const value = structuredClone(opening)
  value.input.balance_centavos = 999
  value.input.store_id = 77
  assert.deepEqual(readOpening({ getItem: () => JSON.stringify(value) }, key, 2), opening)
  assert.equal(readOpening({ getItem: () => JSON.stringify(value) }, key, 3), null)
  assert.notEqual(key, openingStorageKey(2, 2))
})
test('malformed opening recovery and late cleanup cannot create or remove another request', () => {
  for (const input of [
    { ...opening.input, amount_centavos: 0 },
    { ...opening.input, amount_centavos: 1.5 },
    { ...opening.input, request_key: 'bad' },
    { ...opening.input, notes: '  ' },
  ])
    assert.equal(
      readOpening({ getItem: () => JSON.stringify({ ...opening, input }) }, key, 2),
      null,
    )
  let removed = false
  removeOpening(
    {
      getItem: () => JSON.stringify(opening),
      removeItem: () => {
        removed = true
      },
    },
    key,
    'another-key',
  )
  assert.equal(removed, false)
  removeOpening(
    {
      getItem: () => JSON.stringify(opening),
      removeItem: () => {
        removed = true
      },
    },
    key,
    opening.input.request_key,
  )
  assert.equal(removed, true)
})
test('customer statement treats opening debt as an increase and repayments and reversals as decreases', () => {
  assert.equal(decreasesBalance(base), false)
  assert.equal(decreasesBalance(payment), true)
  assert.equal(decreasesBalance({ ...payment, entry_type: 'reversal' }), true)
  const rows = statementRows(statement)
  assert.deepEqual(rows.at(-2).slice(3, 6), ['50.00', '0.00', '50.00'])
  assert.deepEqual(rows.at(-1).slice(3, 6), ['0.00', '10.00', '40.00'])
  assert.match(statementText(statement), /Opening utang/)
  assert.match(statementText(statement), /OUTSTANDING: ₱40.00/)
})
test('statement text and CSV preserve large exact balances', () => {
  const huge = {
    ...statement,
    customer: { ...statement.customer, balance_centavos: '90071992547409930' },
  }
  assert.ok(
    statementRows(huge).some(
      (row) => row[0] === 'Outstanding PHP' && row[1] === '900719925474099.30',
    ),
  )
  assert.match(statementText(huge), /900,719,925,474,099\.30/)
})
test('payment acknowledgment retains historical customer and actor and does not invent sale details', () => {
  const text = paymentSlipText(payment)
  assert.match(text, /Original customer/)
  assert.match(text, /Original owner/)
  assert.match(text, /PAY-00000002/)
  assert.match(text, /Cash received: ₱10.00/)
  assert.match(text, /Utang after payment: ₱40.00/)
  assert.doesNotMatch(text, /Updated customer|SALES SUMMARY/)
})
test('statement loader pins the first financial snapshot and follows all server pages', async () => {
  const requests = []
  const stub = `export const http={get:async(path,options)=>globalThis.__statementGet(path,options)}`
  const stubUrl = `data:text/javascript;base64,${Buffer.from(stub).toString('base64')}`
  const { loadStatement } = await import(
    await source('./statements/api.ts', { '../../api/http': stubUrl })
  )
  globalThis.__statementGet = async (path, options) => {
    requests.push({ path, signal: options.signal })
    return { data: { ...statement, data: requests.length === 1 ? [base] : [payment] } }
  }
  try {
    const controller = new AbortController(),
      result = await loadStatement('/statement', controller.signal)
    assert.deepEqual(result.data, [base, payment])
    assert.equal(requests.length, 2)
    assert.match(requests[1].path, /through_id=2/)
    assert.equal(requests[0].signal, controller.signal)
    assert.equal(result.customer.balance_centavos, '4000')
  } finally {
    delete globalThis.__statementGet
  }
})
