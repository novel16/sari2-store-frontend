import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../testing/sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const { barPercent, chartTotals, dashboardDate } = await import(await sourceModule('./format.ts'))

test('daily chart totals preserve centavos beyond JavaScript safe integers', () => {
  assert.deepEqual(
    chartTotals([
      { date: '2026-10-15', net_sales_centavos: '9007199254740993', transactions: 12 },
      { date: '2026-10-16', net_sales_centavos: '19', transactions: 3 },
      { date: '2026-10-17', net_sales_centavos: '0', transactions: 0 },
    ]),
    { sales: '9007199254741012', transactions: 15 },
  )
  assert.deepEqual(chartTotals([]), { sales: '0', transactions: 0 })
})

test('chart scales exact huge values without overflow or invalid zero-state ratios', () => {
  assert.equal(barPercent('9007199254740993', '18014398509481986'), 50)
  assert.equal(barPercent('1', '3'), 33.33)
  assert.equal(barPercent('0', '0'), 0)
  assert.equal(barPercent(2, 0), 0)
  assert.equal(barPercent(0, 10), 0)
  assert.equal(barPercent(10, 10), 100)
  assert.equal(barPercent(11, 10), 100)
})

test('business-date labels keep the API date in Manila even when the device timezone differs', () => {
  const original = process.env.TZ
  try {
    for (const zone of ['UTC', 'America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Tokyo']) {
      process.env.TZ = zone
      assert.equal(dashboardDate('2027-01-01'), 'Jan 1, 2027')
      assert.equal(dashboardDate('2026-10-16', { weekday: 'long' }), 'Friday, Oct 16, 2026')
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})
