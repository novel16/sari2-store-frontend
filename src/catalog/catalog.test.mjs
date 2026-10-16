import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { createSourceModule } from '../testing/sourceModule.mjs'

const sourceModule = createSourceModule(import.meta.url)
const { money, parseCentavos } = await import(await sourceModule('../lib/format.ts'))
const { csvCell } = await import(await sourceModule('../lib/csv.ts'))

test('peso entry converts to exact integer centavos without floating-point rounding', () => {
  for (const [text, cents] of [
    ['0', 0],
    ['0.01', 1],
    ['15.25', 1525],
    ['1.1', 110],
    ['0005.09', 509],
    ['10000000.00', 1000000000],
  ])
    assert.equal(parseCentavos(text), cents)
})

test('invalid fractional negative exponent and oversized prices are rejected', () => {
  for (const text of ['', '-1', '1.001', '1e5', 'Infinity', 'NaN', '10000000.01'])
    assert.throws(() => parseCentavos(text))
})

test('large inventory valuations retain exact centavos beyond JavaScript safe integers', () => {
  assert.equal(money('9007199254740993'), '₱90,071,992,547,409.93')
  assert.equal(money('0'), '₱0.00')
})

test('CSV quotes embedded delimiters and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('Water, "large"'), '"Water, ""large"""')
  for (const value of ['=SUM(1,2)', '+123', '-1+2', '@SUM(A1)', '  =1+1', '\t=1+1'])
    assert.ok(csvCell(value).startsWith('"\''))
  assert.equal(csvCell('001234'), '"001234"')
})

test('category options follow every server page without dropping records after the first hundred', async () => {
  const require = createRequire(import.meta.url)
  const axiosUrl = pathToFileURL(require.resolve('axios')).href
  const httpUrl = await sourceModule(
    '../api/http.ts',
    { axios: axiosUrl },
    { 'import.meta.env': '({ VITE_API_URL: "http://localhost:8000" })' },
  )
  const { http } = await import(httpUrl)
  const { loadCategoryOptions } = await import(
    await sourceModule('./api.ts', { '../api/http': httpUrl })
  )
  const pages = []
  http.defaults.adapter = async (config) => {
    pages.push(config.params.page)
    assert.match(config.url, /status=all/)
    return {
      data: { data: [{ id: config.params.page }], meta: { last_page: 2 } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  assert.deepEqual(
    await loadCategoryOptions('/categories?status=all', new AbortController().signal),
    [{ id: 1 }, { id: 2 }],
  )
  assert.deepEqual(pages, [1, 2])
})
