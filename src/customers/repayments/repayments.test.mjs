import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../../testing/sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const format = await sourceModule('../../lib/format.ts')
const { repaymentAmounts, createRepayment, readRepayment, removeRepayment, repaymentStorageKey } =
  await import(await sourceModule('./recovery.ts', { '../../lib/format': format }))
const customer = {
  id: 12,
  store_id: 2,
  name: 'Aling Linda',
  phone: '09123456789',
  status: 'active',
  balance_centavos: '35000',
  notes: 'Private customer note',
}
const key = '41c149aa-79bb-42dc-9603-1599e5311ea5'

test('partial and full payments reduce the balance using exact centavos', () => {
  assert.deepEqual(repaymentAmounts('100', '35000'), {
    amount: 10000,
    remaining: '25000',
    error: '',
  })
  assert.deepEqual(repaymentAmounts('350.00', '35000'), {
    amount: 35000,
    remaining: '0',
    error: '',
  })
  assert.equal(repaymentAmounts('1.05', '9007199254740993').remaining, '9007199254740888')
})

test('zero negative fractional exponent oversized and overpayments are rejected', () => {
  for (const text of ['', '0', '-1', '1.001', '1e3', '350.01', 'Infinity', '10000000.01'])
    assert.ok(repaymentAmounts(text, '35000').error, text)
  assert.ok(repaymentAmounts('0.01', '0').error)
})

test('repayment recovery preserves the reviewed balance and exact request after reload', () => {
  const value = createRepayment(customer, 10000, '  Cash received today  ', key)
  assert.equal(value.input.expected_balance_centavos, '35000')
  assert.equal(value.input.notes, 'Cash received today')
  assert.equal(value.customer.notes, undefined)
  assert.deepEqual(readRepayment({ getItem: () => JSON.stringify(value) }, 'pending', 2), value)
  assert.equal(readRepayment({ getItem: () => JSON.stringify(value) }, 'pending', 3), null)
  assert.notEqual(repaymentStorageKey(1, 2), repaymentStorageKey(2, 2))
  assert.notEqual(repaymentStorageKey(1, 2), repaymentStorageKey(1, 3))
})

test('corrupt and inconsistent recovery records cannot submit a payment', () => {
  for (const text of ['null', '{invalid', '{}'])
    assert.equal(readRepayment({ getItem: () => text }, 'pending', 2), null)
  for (const mutate of [
    (value) => {
      value.input.amount_centavos = 35001
    },
    (value) => {
      value.input.amount_centavos = 0
    },
    (value) => {
      value.input.method = 'credit'
    },
    (value) => {
      value.input.expected_balance_centavos = '25000'
    },
    (value) => {
      value.input.request_key = 'invalid'
    },
    (value) => {
      value.customer.balance_centavos = 'not-money'
    },
    (value) => {
      value.input.notes = 'x'.repeat(256)
    },
  ]) {
    const value = createRepayment(customer, 10000, '', key)
    mutate(value)
    assert.equal(readRepayment({ getItem: () => JSON.stringify(value) }, 'pending', 2), null)
  }
  assert.equal(
    readRepayment(
      {
        getItem: () => {
          throw new Error('Unavailable storage')
        },
      },
      'pending',
      2,
    ),
    null,
  )
})

test('late successful responses cannot delete another pending repayment', () => {
  let saved = JSON.stringify(createRepayment(customer, 10000, '', key))
  const storage = {
    getItem: () => saved,
    removeItem: () => {
      saved = null
    },
  }
  removeRepayment(storage, 'pending', 'a-different-key')
  assert.ok(saved)
  removeRepayment(storage, 'pending', key)
  assert.equal(saved, null)
})

test('archived customers can retain recovery for an existing cash payment', () => {
  const value = createRepayment({ ...customer, status: 'archived' }, 10000, '', key)
  assert.deepEqual(readRepayment({ getItem: () => JSON.stringify(value) }, 'pending', 2), value)
})
