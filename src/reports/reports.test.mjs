import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../testing/sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const datesUrl = await sourceModule('./dates.ts')
const moneyUrl = await sourceModule('./money.ts')
const csvUrl = await sourceModule('../lib/csv.ts')
const { presetRange, rangeError, reportDate } = await import(datesUrl)
const { averageSale, decimalPesos, reportPercent } = await import(moneyUrl)
const { csvCell } = await import(csvUrl)
const { reportRows } = await import(
  await sourceModule('./exportReport.ts', { '../lib/csv': csvUrl, './money': moneyUrl })
)

test('date presets use Monday weeks and handle month year and Sunday boundaries', () => {
  assert.deepEqual(presetRange('today', '2027-01-01'), {
    date_from: '2027-01-01',
    date_to: '2027-01-01',
  })
  assert.deepEqual(presetRange('this_week', '2027-01-01'), {
    date_from: '2026-12-28',
    date_to: '2027-01-01',
  })
  assert.deepEqual(presetRange('this_week', '2026-10-18'), {
    date_from: '2026-10-12',
    date_to: '2026-10-18',
  })
  assert.deepEqual(presetRange('this_week', '2026-10-19'), {
    date_from: '2026-10-19',
    date_to: '2026-10-19',
  })
  assert.deepEqual(presetRange('this_month', '2028-02-29'), {
    date_from: '2028-02-01',
    date_to: '2028-02-29',
  })
})

test('custom ranges reject invalid calendar dates inversion and more than 366 days', () => {
  for (const [from, to] of [
    ['', '2026-10-16'],
    ['2026-02-30', '2026-03-01'],
    ['2026-10-17', '2026-10-16'],
    ['2028-01-01', '2029-01-01'],
    ['1969-12-31', '1970-01-01'],
    ['9999-01-01', '9999-01-01'],
  ])
    assert.ok(rangeError({ date_from: from, date_to: to }), `${from} to ${to}`)
  assert.equal(rangeError({ date_from: '2028-01-01', date_to: '2028-12-31' }), undefined)
  assert.equal(rangeError({ date_from: '2026-10-16', date_to: '2026-10-16' }), undefined)
})

test('report labels and preset arithmetic are independent of the device timezone', () => {
  const original = process.env.TZ
  try {
    for (const zone of ['UTC', 'America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Tokyo']) {
      process.env.TZ = zone
      assert.equal(reportDate('2027-01-01'), 'Jan 1, 2027')
      assert.deepEqual(presetRange('this_week', '2027-01-01'), {
        date_from: '2026-12-28',
        date_to: '2027-01-01',
      })
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})

test('currency exports averages and chart percentages preserve exact large centavos', () => {
  assert.equal(decimalPesos('9007199254740993'), '90071992547409.93')
  assert.equal(decimalPesos('1'), '0.01')
  assert.equal(decimalPesos('0'), '0.00')
  assert.equal(averageSale('9007199254740993', 3), '3002399751580331')
  assert.equal(averageSale('5', 2), '3')
  assert.equal(averageSale('1', 3), '0')
  assert.equal(averageSale('0', 0), '0')
  assert.equal(reportPercent('9007199254740993', '18014398509481986'), 50)
  assert.equal(reportPercent('0', '0'), 0)
})

function reportFixture() {
  const zero = {
    transactions: 0,
    repayment_count: 0,
    units_sold: '0',
    gross_sales_centavos: '0',
    discounts_centavos: '0',
    net_sales_centavos: '0',
    cash_sales_centavos: '0',
    credit_sales_centavos: '0',
    repayments_centavos: '0',
    cash_collected_centavos: '0',
  }
  return {
    store: { id: 7, name: '=QA,"Store"' },
    timezone: 'Asia/Manila',
    generated_at: '2026-10-16T03:00:00+00:00',
    date_from: '2026-10-15',
    date_to: '2026-10-16',
    summary: {
      ...zero,
      transactions: 2,
      units_sold: '4',
      gross_sales_centavos: '6000',
      discounts_centavos: '200',
      net_sales_centavos: '5800',
      cash_sales_centavos: '2900',
      credit_sales_centavos: '2900',
      repayments_centavos: '1000',
      cash_collected_centavos: '3900',
      repayment_count: 1,
    },
    days: [
      { date: '2026-10-15', ...zero },
      {
        date: '2026-10-16',
        ...zero,
        repayment_count: 1,
        repayments_centavos: '1000',
        cash_collected_centavos: '1000',
      },
    ],
    top_products_limit: 10,
    top_products: [
      {
        product_id: 3,
        name: '@QA,"Water"',
        unit: 'piece',
        units_sold: '9007199254740993',
        gross_sales_centavos: '9007199254740993',
      },
    ],
  }
}

test('report CSV uses the supplied snapshot dates and separates sales from debt collections', () => {
  const fixture = reportFixture()
  const before = JSON.stringify(fixture)
  const rows = reportRows(fixture)
  assert.deepEqual(
    rows.find((row) => row[0] === 'Date from'),
    ['Date from', '2026-10-15'],
  )
  assert.deepEqual(
    rows.find((row) => row[0] === 'Sales after discounts'),
    ['Sales after discounts', '58.00'],
  )
  assert.deepEqual(
    rows.find((row) => row[0] === 'Cash utang repayments'),
    ['Cash utang repayments', '10.00'],
  )
  assert.deepEqual(
    rows.find((row) => row[0] === 'Total cash collected (cash sales + repayments)'),
    ['Total cash collected (cash sales + repayments)', '39.00'],
  )
  assert.ok(rows.some((row) => row[0] === '2026-10-15' && row[5] === '0.00'))
  assert.ok(rows.some((row) => row[0] === '2026-10-16' && row[5] === '0.00' && row[9] === '10.00'))
  assert.ok(
    rows.some(
      (row) =>
        row[1] === '@QA,"Water"' && row[3] === '9007199254740993' && row[4] === '90071992547409.93',
    ),
  )
  assert.equal(JSON.stringify(fixture), before)
})

test('CSV serialization escapes quotes and neutralizes formula-like store and product names', () => {
  const csv = reportRows(reportFixture())
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')
  assert.ok(csv.includes(`"'=QA,""Store"""`))
  assert.ok(csv.includes(`"'@QA,""Water"""`))
})

test('empty report CSV contains real zero rows and no fabricated product sales', () => {
  const fixture = reportFixture()
  fixture.summary = { ...fixture.days[0] }
  fixture.top_products = []
  const rows = reportRows(fixture)
  assert.deepEqual(
    rows.find((row) => row[0] === 'Sales after discounts'),
    ['Sales after discounts', '0.00'],
  )
  assert.ok(!rows.some((row) => row.includes('@QA,"Water"')))
})

test('reversal CSV keeps negative event-date net totals as exact numeric decimals', () => {
  const fixture = reportFixture()
  Object.assign(fixture.summary, {
    reversal_count: 1,
    reversed_sales_centavos: '10000',
    cash_refunds_centavos: '10000',
    net_after_reversals_centavos: '-4200',
    net_cash_collected_centavos: '-6100',
  })
  const rows = reportRows(fixture)
  assert.deepEqual(
    rows.find((row) => row[0] === 'Net sales after reversals PHP'),
    ['Net sales after reversals PHP', '-42.00'],
  )
  assert.deepEqual(
    rows.find((row) => row[0] === 'Net cash collected PHP'),
    ['Net cash collected PHP', '-61.00'],
  )
  assert.equal(csvCell('-42.00'), '"-42.00"')
  assert.equal(csvCell('-1+2'), '"\'-1+2"')
})
