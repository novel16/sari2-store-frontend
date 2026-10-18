import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { act, createElement } from 'react'
import axios from 'axios'
import { installDom } from '../testing/dom.mjs'
import { createSourceModule } from '../testing/sourceModule.mjs'

const dom = installDom()
const { createRoot } = await import('react-dom/client')
after(() => dom.cleanup())
const require = createRequire(import.meta.url)
const source = createSourceModule(import.meta.url)
const imports = Object.fromEntries(
  ['react', 'react/jsx-runtime', 'lucide-react', 'axios'].map((name) => [
    name,
    pathToFileURL(require.resolve(name)).href,
  ]),
)
const stub = (text) => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64')
const auth = stub('export const useAuth=()=>({refresh:async()=>{}})')
const http = stub(
  'export const http={get:(...args)=>globalThis.__cashHttp.get(...args)}; export const writeWithCsrf=(...args)=>globalThis.__cashHttp.write(...args)',
)
const catalog = stub("export const storePath=id=>'/api/v1/stores/'+id")
const authErrors = await source('../auth/errors.ts', imports)
const apiErrors = await source('../api/errors.ts', { ...imports, '../auth/errors': authErrors })
const money = await source('../lib/format.ts')
const format = await source('./format.ts', {
  '../lib/format': money,
  '../reports/money': await source('../reports/money.ts'),
  '../lib/csv': await source('../lib/csv.ts'),
})
const api = await source('./api.ts', { '../api/http': http, '../catalog/api': catalog })
const recovery = await source('./recovery.ts')
const hook = await source('./useCashOperation.ts', {
  ...imports,
  '../api/errors': apiErrors,
  '../auth/errors': authErrors,
  '../auth/useAuth': auth,
  './api': api,
  './recovery': recovery,
})
const ui = stub(
  (
    await Promise.all(
      ['Modal', 'PageHeader'].map(
        async (name) =>
          'export {' +
          name +
          "} from '" +
          (await source('../components/ui/' + name + '.tsx', imports)) +
          "'",
      ),
    )
  ).join('\n'),
)
const query = stub(
  "import {useState,useCallback} from '" +
    imports.react +
    "'; export function useStoreQuery(path){const [,set]=useState(0);const reload=useCallback(()=>set(value=>value+1),[]);return {data:path?globalThis.__cashQuery(path):undefined,isLoading:false,error:undefined,reload}}",
)
const common = {
  ...imports,
  '../components/ui': ui,
  '../lib/format': money,
  './format': format,
  './api': api,
  '../auth/components/FormError': await source('../auth/components/FormError.tsx', imports),
  '../auth/useAuth': auth,
  '../auth/errors': authErrors,
  '../api/errors': apiErrors,
  '../hooks/useStoreQuery': query,
  '../components/ui/QueryState': await source('../components/ui/QueryState.tsx', imports),
  '../components/ui/Pagination': await source('../components/ui/Pagination.tsx', imports),
  './recovery': recovery,
  './useCashOperation': hook,
}
const modules = {}
for (const name of [
  'CashBreakdown',
  'CashRecovery',
  'ReviewCashChange',
  'OpenCashDay',
  'CashMovementDialog',
  'CashCloseDialog',
  'CashMovements',
  'CashDayHistory',
  'CashDayDetails',
]) {
  modules['./' + name] = await source('./' + name + '.tsx', { ...common, ...modules })
}
const { default: CashClosingWorkspace } = await import(
  await source('./CashClosingWorkspace.tsx', { ...common, ...modules })
)
const { cashStorageKey } = await import(recovery)
const storageKey = cashStorageKey(1, 2)
const base = '/api/v1/stores/2/cash-days'
const businessDate = '2026-02-01'
const actor = { id: 1, name: 'Maria' }
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
const day = {
  id: 3,
  store_id: 2,
  business_date: businessDate,
  status: 'open',
  opening_cash_centavos: '10000',
  notes: null,
  opened_at: '2026-02-01T00:00:00Z',
  opened_by: actor,
  closed_at: null,
  closed_by: null,
  closing: null,
}
const meta = { current_page: 1, last_page: 1, total: 1, per_page: 10, from: 1, to: 1 }
let model
let writes
function setup(open = true) {
  sessionStorage.clear()
  model = {
    current: {
      data: open ? structuredClone(day) : null,
      business_date: businessDate,
      time_zone: 'Asia/Manila',
      totals: open ? structuredClone(totals) : null,
    },
    history: open ? [structuredClone(day)] : [],
    movements: [],
  }
  writes = []
  globalThis.__cashQuery = (path) => {
    if (path === base + '/current') return model.current
    if (path.includes('/movements?'))
      return { data: model.movements, meta: { ...meta, total: model.movements.length } }
    if (path === base + '/3') return { data: model.current.data, totals: model.current.totals }
    return { data: model.history, meta: { ...meta, total: model.history.length } }
  }
  globalThis.__cashHttp = {
    get: async () => ({ data: { data: model.current.data, totals: model.current.totals } }),
    write: async (method, path, input) => {
      writes.push({ method, path, input: structuredClone(input) })
      if (path.endsWith('/close-preview')) return { data: review(input) }
      if (path.endsWith('/close')) {
        const closing = review({ counted_cash_centavos: 16000, notes: 'Counted shortage' })
        model.current.data = {
          ...model.current.data,
          status: 'closed',
          closing: {
            totals: closing.totals,
            counted_cash_centavos: closing.counted_cash_centavos,
            variance_centavos: closing.variance_centavos,
            notes: closing.notes,
          },
          closed_at: '2026-02-01T12:00:00Z',
          closed_by: actor,
        }
      } else if (path === base) {
        model.current.data = {
          ...structuredClone(day),
          opening_cash_centavos: String(input.opening_cash_centavos),
          notes: input.notes,
        }
        model.current.totals = {
          ...totals,
          opening_cash_centavos: String(input.opening_cash_centavos),
        }
      }
      return { data: model.current.data, totals: model.current.totals }
    },
  }
}
function review(input) {
  return {
    cash_day_id: 3,
    store_id: 2,
    business_date: businessDate,
    totals: structuredClone(totals),
    counted_cash_centavos: String(input.counted_cash_centavos),
    variance_centavos: (
      BigInt(input.counted_cash_centavos) - BigInt(totals.expected_cash_centavos)
    ).toString(),
    notes: input.notes,
    review_token: 'signed-token-' + writes.length,
    expires_at: '2030-02-01T12:10:00Z',
  }
}
function responseError(
  status,
  code,
  { method = 'post', path = base + '/3/close', fields = {} } = {},
) {
  const config = { method, url: path }
  return new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
    status,
    data: { code, message: 'Review the cash details', errors: fields },
    config,
    statusText: '',
    headers: {},
  })
}
async function mount(t) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  let active = true
  const unmount = async () => {
    if (active) {
      await act(async () => root.unmount())
      active = false
    }
    container.remove()
  }
  t.after(unmount)
  await act(async () => root.render(createElement(CashClosingWorkspace, { userId: 1, storeId: 2 })))
  return { container, unmount }
}
async function click(container, text) {
  const element = [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text,
  )
  assert.ok(element, 'Missing button: ' + text)
  assert.equal(element.disabled, false, 'Disabled button: ' + text)
  await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}
async function fill(container, name, value) {
  const element = container.querySelector('[name="' + name + '"]')
  assert.ok(element, 'Missing field: ' + name)
  const prototype =
    element.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function submit(container) {
  const form = container.querySelector('[role=dialog] form') ?? container.querySelector('form')
  assert.ok(form)
  await act(async () =>
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
}
async function closeReview(container) {
  await click(container, 'Count & close day')
  await fill(container, 'counted_cash', '160')
  await fill(container, 'closing_notes', 'Counted shortage')
  await submit(container)
}

test('opening reviews server date and float without a financial POST until explicit confirmation', async (t) => {
  setup(false)
  const page = await mount(t)
  assert.match(page.container.textContent, /2026-02-01/)
  await fill(page.container, 'opening_cash', '100')
  await fill(page.container, 'opening_notes', 'Starting float')
  await submit(page.container)
  assert.equal(writes.length, 0)
  assert.match(page.container.querySelector('[role=dialog]').textContent, /cannot be edited later/)
  await click(page.container, 'Confirm & save')
  assert.equal(writes.length, 1)
  assert.equal(writes[0].path, base)
  assert.equal(writes[0].input.business_date, businessDate)
  assert.equal(writes[0].input.opening_cash_centavos, 10000)
  assert.equal(sessionStorage.getItem(storageKey), null)
})

test('manual movements require a reason and review before posting any cash change', async (t) => {
  setup()
  const page = await mount(t)
  await click(page.container, 'Record cash in / out')
  await fill(page.container, 'movement_amount', '20.50')
  await fill(page.container, 'movement_reason', 'Additional change')
  await submit(page.container)
  assert.equal(writes.length, 0)
  const original = globalThis.__cashHttp.write
  globalThis.__cashHttp.write = async (method, path, input) => {
    writes.push({ method, path, input: structuredClone(input) })
    return {
      data: {
        id: 4,
        cash_day_id: 3,
        store_id: 2,
        direction: input.direction,
        amount_centavos: String(input.amount_centavos),
        reason: input.reason,
        actor,
        created_at: day.opened_at,
      },
      day: model.current.data,
      totals,
    }
  }
  await click(page.container, 'Confirm & save')
  assert.equal(writes.length, 1)
  assert.equal(writes[0].path, base + '/3/movements')
  assert.equal(writes[0].input.amount_centavos, 2050)
  globalThis.__cashHttp.write = original
})

test('closing preview is read-only and final save requires explicit confirmation of server totals', async (t) => {
  setup()
  const page = await mount(t)
  await closeReview(page.container)
  assert.equal(writes.length, 1)
  assert.equal(writes[0].path, base + '/3/close-preview')
  const dialog = page.container.querySelector('[role=dialog]')
  assert.match(dialog.textContent, /Short by/)
  assert.match(dialog.textContent, /cannot be reopened/)
  await click(page.container, 'Confirm final closing')
  assert.equal(writes.length, 2)
  assert.equal(writes[1].path, base + '/3/close')
  assert.ok(writes[1].input.review_token)
  assert.ok(writes[1].input.request_key)
  assert.match(page.container.textContent, /Final cash closing saved/)
  assert.match(page.container.textContent, /Utang-only sales remain available/)
  assert.ok(
    [...page.container.querySelectorAll('button')].find((item) =>
      item.textContent.includes('Download closing CSV'),
    ),
  )
})

test('server variance note errors identify the field and keep the entered cash count editable', async (t) => {
  setup()
  globalThis.__cashHttp.write = async () => {
    throw responseError(422, undefined, {
      path: base + '/3/close-preview',
      fields: { notes: ['Explain the cash difference with at least 3 characters.'] },
    })
  }
  const page = await mount(t)
  await click(page.container, 'Count & close day')
  await fill(page.container, 'counted_cash', '160')
  await submit(page.container)
  assert.match(page.container.textContent, /Explain the cash difference/)
  assert.equal(
    page.container.querySelector('[name=closing_notes]').getAttribute('aria-invalid'),
    'true',
  )
  assert.equal(page.container.querySelector('[name=counted_cash]').value, '160')
  assert.equal(sessionStorage.getItem(storageKey), null)
})

test('a lost closing response survives remount and same-key lookup confirms exactly one final closing', async (t) => {
  setup()
  const normal = globalThis.__cashHttp.write
  let committed = 0
  globalThis.__cashHttp.write = async (method, path, input) => {
    const result = await normal(method, path, input)
    if (path.endsWith('/close')) {
      committed++
      throw Error('Response lost after commit')
    }
    return result
  }
  const page = await mount(t)
  await closeReview(page.container)
  await click(page.container, 'Confirm final closing')
  const attempt = JSON.parse(sessionStorage.getItem(storageKey))
  assert.equal(committed, 1)
  assert.ok(attempt)
  assert.equal(
    page.container.querySelector('[name=counted_cash]'),
    null,
    'Unknown writes freeze editing',
  )
  await page.unmount()
  const next = await mount(t)
  let lookup
  globalThis.__cashHttp.get = async (path) => {
    lookup = path
    return { data: { data: model.current.data, totals: model.current.totals } }
  }
  await click(next.container, 'Check saved change')
  assert.equal(lookup, base + '/closings/by-key/' + attempt.input.request_key)
  assert.equal(committed, 1)
  assert.equal(sessionStorage.getItem(storageKey), null)
})

test('stale recovery retry requires a fresh closing review while retaining the count and notes', async (t) => {
  setup()
  let confirms = 0
  globalThis.__cashHttp.write = async (method, path, input) => {
    writes.push({ method, path, input: structuredClone(input) })
    if (path.endsWith('/close-preview')) return { data: review(input) }
    confirms++
    if (confirms === 1) throw Error('Unknown result')
    throw responseError(409, 'cash_activity_changed')
  }
  const page = await mount(t)
  await closeReview(page.container)
  await click(page.container, 'Confirm final closing')
  const first = JSON.parse(sessionStorage.getItem(storageKey))
  await click(page.container, 'Retry same cash change')
  assert.equal(sessionStorage.getItem(storageKey), null)
  assert.equal(page.container.querySelector('[name=counted_cash]').value, '160')
  assert.equal(page.container.querySelector('[name=closing_notes]').value, 'Counted shortage')
  assert.equal(
    [...page.container.querySelectorAll('button')].some(
      (button) => button.textContent === 'Confirm final closing',
    ),
    false,
  )
  assert.deepEqual(writes[2].input, first.input)
  await submit(page.container)
  assert.equal(writes.at(-1).path, base + '/3/close-preview')
  assert.notEqual(page.container.querySelector('[role=dialog]'), null)
})

test('CSRF failures, unknown conflicts and missing lookups preserve the same pending cash identity', async (t) => {
  setup()
  const normal = globalThis.__cashHttp.write
  let failure = Error('Network error')
  globalThis.__cashHttp.write = async (method, path, input) => {
    if (path.endsWith('/close-preview')) return normal(method, path, input)
    throw failure
  }
  const page = await mount(t)
  await closeReview(page.container)
  await click(page.container, 'Confirm final closing')
  const original = sessionStorage.getItem(storageKey)
  for (const next of [
    responseError(422, undefined, { method: 'get', path: '/sanctum/csrf-cookie' }),
    responseError(404),
    responseError(409, 'cash_key_conflict'),
    responseError(503),
  ]) {
    failure = next
    await click(page.container, 'Retry same cash change')
    assert.equal(sessionStorage.getItem(storageKey), original)
  }
  globalThis.__cashHttp.get = async () => {
    throw responseError(404, undefined, { method: 'get', path: base + '/closings/by-key/missing' })
  }
  await click(page.container, 'Check saved change')
  assert.equal(sessionStorage.getItem(storageKey), original)
  assert.match(page.container.textContent, /No saved cash change was found yet/)
})

test('late cash responses after navigation keep recovery until the next mounted workspace confirms them', async (t) => {
  setup(false)
  let finish
  globalThis.__cashHttp.write = async (_method, _path, input) => {
    await new Promise((resolve) => {
      finish = resolve
    })
    return { data: { ...day, opening_cash_centavos: String(input.opening_cash_centavos) }, totals }
  }
  const page = await mount(t)
  await fill(page.container, 'opening_cash', '100')
  await submit(page.container)
  await click(page.container, 'Confirm & save')
  const original = sessionStorage.getItem(storageKey)
  await page.unmount()
  await act(async () => finish())
  assert.equal(sessionStorage.getItem(storageKey), original)
  const next = await mount(t)
  globalThis.__cashHttp.get = async () => ({ data: { data: day, totals } })
  await click(next.container, 'Check saved change')
  assert.equal(sessionStorage.getItem(storageKey), null)
})

test('history and manual movements paginate independently and an earlier open day can still be closed', async (t) => {
  setup()
  const earlier = { ...structuredClone(day), id: 4, business_date: '2026-01-31' }
  const normalQuery = globalThis.__cashQuery
  const paths = []
  globalThis.__cashQuery = (path) => {
    paths.push(path)
    if (path.startsWith(base + '?')) {
      const page = Number(new URL('http://local' + path).searchParams.get('page'))
      return {
        data: page === 1 ? [day] : [earlier],
        meta: { ...meta, current_page: page, last_page: 2, total: 2, from: page, to: page },
      }
    }
    if (path === base + '/4') return { data: earlier, totals }
    if (path.startsWith(base + '/4/movements?')) {
      const page = Number(new URL('http://local' + path).searchParams.get('page'))
      return {
        data: [
          {
            id: page,
            cash_day_id: 4,
            store_id: 2,
            direction: 'out',
            amount_centavos: '500',
            reason: 'Deposit ' + page,
            actor,
            created_at: day.opened_at,
          },
        ],
        meta: { ...meta, current_page: page, last_page: 2, total: 2, from: page, to: page },
      }
    }
    return normalQuery(path)
  }
  const page = await mount(t)
  const section = (heading) =>
    [...page.container.querySelectorAll('section')].find(
      (element) => element.querySelector('h2')?.textContent === heading,
    )
  const history = section('Cash day history')
  await act(async () =>
    history
      .querySelector('[aria-label="Next page"]')
      .dispatchEvent(new MouseEvent('click', { bubbles: true })),
  )
  await click(history, 'View 2026-01-31')
  assert.match(page.container.textContent, /earlier cash day is still open/)
  const movementButton = [...page.container.querySelectorAll('button')].find(
    (element) => element.textContent === 'Record cash in / out',
  )
  assert.equal(movementButton.disabled, true)
  const closeButton = [...page.container.querySelectorAll('button')].find(
    (element) => element.textContent === 'Count & close day',
  )
  assert.equal(closeButton.disabled, false)
  const movements = section('Manual cash movements')
  assert.match(movements.textContent, /Deposit 1/)
  await act(async () =>
    movements
      .querySelector('[aria-label="Next page"]')
      .dispatchEvent(new MouseEvent('click', { bubbles: true })),
  )
  assert.match(movements.textContent, /Deposit 2/)
  assert.ok(paths.includes(base + '?page=2&per_page=10'))
  assert.ok(paths.includes(base + '/4/movements?page=2&per_page=10'))
})

test('corrupt recovery or unavailable persistence blocks new financial writes', async (t) => {
  setup()
  sessionStorage.setItem(storageKey, '{corrupt')
  const page = await mount(t)
  assert.match(page.container.textContent, /Cash recovery data is unavailable/)
  assert.equal(
    [...page.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Count & close day',
    ).disabled,
    true,
  )
  assert.equal(writes.length, 0)
  await page.unmount()
  setup(false)
  const next = await mount(t)
  await fill(next.container, 'opening_cash', '100')
  await submit(next.container)
  const prototype = Object.getPrototypeOf(sessionStorage)
  const original = prototype.setItem
  prototype.setItem = () => {
    throw Error('Storage full')
  }
  try {
    await click(next.container, 'Confirm & save')
    assert.equal(writes.length, 0)
    assert.match(next.container.textContent, /Cash details could not be saved for recovery/)
  } finally {
    prototype.setItem = original
  }
})

test('expired recovery after remount restores count and notes for a new server review without reusing the token', async (t) => {
  setup()
  const normal = globalThis.__cashHttp.write
  globalThis.__cashHttp.write = async (method, path, input) => {
    if (path.endsWith('/close-preview')) return normal(method, path, input)
    throw Error('Unknown closing result')
  }
  const first = await mount(t)
  await closeReview(first.container)
  await click(first.container, 'Confirm final closing')
  const attempt = JSON.parse(sessionStorage.getItem(storageKey))
  await first.unmount()
  const next = await mount(t)
  globalThis.__cashHttp.write = async () => {
    throw responseError(409, 'cash_review_expired')
  }
  await click(next.container, 'Retry same cash change')
  assert.equal(sessionStorage.getItem(storageKey), null)
  assert.match(next.container.textContent, /Review the cash details/)
  await click(next.container, 'Count & close day')
  assert.equal(next.container.querySelector('[name=counted_cash]').value, '160.00')
  assert.equal(next.container.querySelector('[name=closing_notes]').value, 'Counted shortage')
  assert.equal(
    [...next.container.querySelectorAll('button')].some(
      (button) => button.textContent === 'Confirm final closing',
    ),
    false,
  )
  globalThis.__cashHttp.write = normal
  await submit(next.container)
  assert.notEqual(writes.at(-1).input.review_token, attempt.input.review_token)
  assert.equal(writes.at(-1).path, base + '/3/close-preview')
})

test('an uncommitted opening from a previous server business date requires fresh input and review', async (t) => {
  setup(false)
  globalThis.__cashHttp.write = async () => {
    throw Error('Unknown opening result')
  }
  const page = await mount(t)
  await fill(page.container, 'opening_cash', '100')
  await submit(page.container)
  await click(page.container, 'Confirm & save')
  const original = JSON.parse(sessionStorage.getItem(storageKey))
  model.current.business_date = '2026-02-02'
  globalThis.__cashHttp.write = async (_method, path, input) => {
    assert.equal(input.request_key, original.input.request_key)
    assert.equal(input.business_date, businessDate)
    throw responseError(409, 'cash_date_changed', { path })
  }
  await click(page.container, 'Retry same cash change')
  assert.equal(sessionStorage.getItem(storageKey), null)
  assert.equal(page.container.querySelector('[name=opening_cash]').value, '')
  assert.match(page.container.textContent, /2026-02-02/)
})
