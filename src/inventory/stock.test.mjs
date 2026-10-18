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
const imports = Object.fromEntries(['react', 'react/jsx-runtime', 'lucide-react', 'axios', 'react-router-dom']
  .map((name) => [name, pathToFileURL(require.resolve(name)).href]))
const stub = (text) => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64')
const auth = stub('export const useAuth=()=>({refresh:async()=>{}})')
const api = stub(`export const storePath=id=>'/api/v1/stores/'+id;
export const catalogApi={adjustStock:(...args)=>globalThis.__stockApi(...args)}`)
const authErrors = await source('../auth/errors.ts', imports)
const apiErrors = await source('../api/errors.ts', { ...imports, '../auth/errors': authErrors })
const recovery = await source('./recovery.ts')
const hook = await source('./useStockAdjustment.ts', {
  ...imports, '../catalog/api': api, '../api/errors': apiErrors,
  '../auth/errors': authErrors, '../auth/useAuth': auth, './recovery': recovery,
})
const formError = await source('../auth/components/FormError.tsx', imports)
const recoveryView = await source('./StockAdjustmentRecovery.tsx', {
  ...imports, '../auth/components/FormError': formError,
})
const ui = stub((await Promise.all(['Modal', 'ProductArt', 'PageHeader', 'StatCard', 'Badge', 'EmptyState']
  .map(async (name) => `export {${name}} from '${await source('../components/ui/' + name + '.tsx', imports)}'`))).join('\n'))
const formField = await source('../components/ui/FormField.tsx', imports)
const attributes = await source('../components/ui/fieldAttributes.ts')
const dialog = await source('../pages/inventory/StockAdjustmentDialog.tsx', {
  ...imports, '../../components/ui': ui, '../../components/ui/FormField': formField,
  '../../components/ui/fieldAttributes': attributes, '../../auth/components/FormError': formError,
  '../../inventory/StockAdjustmentRecovery': recoveryView,
})
const constants = await source('../catalog/constants.ts')
const table = await source('../pages/inventory/InventoryTable.tsx', {
  ...imports, '../../components/ui': ui, '../../catalog/constants': constants,
})
const mutation = await source('../hooks/useMutation.ts', {
  ...imports, '../api/errors': apiErrors, '../auth/useAuth': auth,
})
const query = stub('export const useStoreQuery=()=>globalThis.__stockQuery')
const workspace = stub('export const useWorkspace=()=>globalThis.__stockWorkspace')
const format = await source('../lib/format.ts')
const { default: InventoryPage } = await import(await source('../pages/inventory/InventoryPage.tsx', {
  ...imports, '../../components/ui': ui,
  '../../components/ui/Pagination': await source('../components/ui/Pagination.tsx', imports),
  '../../components/ui/QueryState': await source('../components/ui/QueryState.tsx', imports),
  '../../auth/components/FormError': formError, '../../catalog/api': api,
  '../../hooks/useDebouncedValue': stub('export const useDebouncedValue=value=>value'),
  '../../hooks/useMutation': mutation, '../../hooks/useStoreQuery': query,
  '../../hooks/useWorkspace': workspace, '../../lib/format': format,
  './StockAdjustmentDialog': dialog, './InventoryTable': table,
  './InventoryHistoryDialog': stub('export default function History(){return null}'),
  './exportInventory': stub('export const exportInventory=async()=>{}'),
  '../../inventory/useStockAdjustment': hook, '../../inventory/StockAdjustmentRecovery': recoveryView,
}))
const { stockAdjustmentStorageKey } = await import(recovery)
const key = stockAdjustmentStorageKey(1, 2)
const product = {
  id: 3, store_id: 2, name: 'Rice', unit: 'bag', category: null, description: null,
  sku: null, barcode: null, price_centavos: 5000, cost_centavos: 4000,
  low_stock_threshold: 2, status: 'active', emoji: '🌾', color: '#123456',
  inventory: { quantity_on_hand: 10, version: 1 }, created_at: '', updated_at: '',
}

function setup() {
  sessionStorage.clear()
  globalThis.__stockWorkspace = { user: { id: 1 }, store: { id: 2 } }
  globalThis.__stockQuery = {
    data: { data: [product], meta: { current_page: 1, last_page: 1, total: 1, per_page: 20, from: 1, to: 1 } },
    isLoading: false, error: null, reload: () => {},
  }
}
async function mount(t) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  let active = true
  const unmount = async () => {
    if (active) { await act(async () => root.unmount()); active = false }
    container.remove()
  }
  t.after(unmount)
  await act(async () => root.render(createElement(InventoryPage)))
  return { container, root, unmount }
}
async function click(element) {
  assert.ok(element, 'Expected a clickable element')
  await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}
async function adjust(container, { quantity = '10', reason = 'New delivery', mode = 'add' } = {}) {
  await click(container.querySelector('[aria-label="Adjust Rice"]'))
  const form = container.querySelector('form')
  assert.ok(form)
  form.elements.namedItem('quantity').value = quantity
  form.elements.namedItem('reason').value = reason
  form.elements.namedItem('mode').value = mode
  await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
}
function retry(container) {
  return [...container.querySelectorAll('button')].find((button) => button.textContent.includes('Retry same adjustment'))
}
function responseError(status, code, { method = 'post', url = '/api/v1/stores/2/inventory/adjustments' } = {}) {
  const config = { method, url }
  return new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
    status, data: { code, message: 'Stock changed', errors: { quantity: ['Review quantity'] } },
    statusText: '', headers: {}, config,
  })
}

test('lost response survives closing the modal and remounting, and retry changes stock only once', async (t) => {
  setup()
  const requests = []
  const saved = new Set()
  let stock = 10
  globalThis.__stockApi = async (_store, input) => {
    requests.push(structuredClone(input))
    if (!saved.has(input.request_key)) {
      saved.add(input.request_key)
      stock += input.quantity
      throw new Error('Response lost after commit')
    }
    return { meta: { replayed: true } }
  }
  const first = await mount(t)
  await adjust(first.container)
  assert.equal(stock, 20)
  assert.equal(first.container.querySelector('[name="reason"]'), null, 'Uncertain details are frozen')
  const pending = JSON.parse(sessionStorage.getItem(key))
  await click(first.container.querySelector('[aria-label="Close dialog"]'))
  assert.ok(first.container.querySelector('[aria-label="Stock adjustment recovery"]'))
  assert.equal(first.container.querySelector('[aria-label="Adjust Rice"]').disabled, true)
  await first.unmount()
  const next = await mount(t)
  assert.ok(retry(next.container))
  await click(retry(next.container))
  assert.equal(stock, 20)
  assert.deepEqual(requests[1], requests[0])
  assert.equal(requests[1].request_key, pending.input.request_key)
  assert.equal(sessionStorage.getItem(key), null)
  assert.equal(next.container.querySelector('[aria-label="Adjust Rice"]').disabled, false)
  assert.match(next.container.textContent, /Rice: stock adjustment saved/)
})

test('late successful response after navigation keeps recovery until the next page confirms it', async (t) => {
  setup()
  let finish
  const requests = []
  globalThis.__stockApi = async (_store, input) => {
    requests.push(structuredClone(input))
    if (requests.length === 1) await new Promise((resolve) => { finish = resolve })
    return { meta: { replayed: requests.length > 1 } }
  }
  const first = await mount(t)
  await adjust(first.container)
  assert.equal(first.container.querySelector('[aria-label="Close dialog"]').disabled, true)
  await first.unmount()
  await act(async () => { finish() })
  assert.ok(sessionStorage.getItem(key), 'Late response must not silently acknowledge the adjustment')
  const next = await mount(t)
  await click(retry(next.container))
  assert.deepEqual(requests[1], requests[0])
  assert.equal(sessionStorage.getItem(key), null)
})

test('CSRF failures and unknown conflicts retain the original pending request', async (t) => {
  setup()
  let failure = new Error('Response lost')
  globalThis.__stockApi = async () => { throw failure }
  const page = await mount(t)
  await adjust(page.container)
  const original = sessionStorage.getItem(key)
  for (const next of [
    responseError(404, undefined, { method: 'get', url: '/sanctum/csrf-cookie' }),
    responseError(422, undefined, { method: 'get', url: '/sanctum/csrf-cookie' }),
    responseError(404), responseError(409, 'adjustment_key_conflict'), responseError(503),
  ]) {
    failure = next
    await click(retry(page.container))
    assert.equal(sessionStorage.getItem(key), original)
    assert.ok(retry(page.container))
  }
})

test('definitive POST rejection permits a fresh review; invalid local input never poisons recovery', async (t) => {
  setup()
  let calls = 0
  globalThis.__stockApi = async () => { calls++; throw responseError(409, 'stock_changed') }
  const page = await mount(t)
  await adjust(page.container, { quantity: '0' })
  assert.equal(calls, 0)
  assert.equal(sessionStorage.getItem(key), null)
  const form = page.container.querySelector('form')
  form.elements.namedItem('quantity').value = '10'
  form.elements.namedItem('reason').value = '   '
  await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
  assert.equal(calls, 0)
  assert.equal(sessionStorage.getItem(key), null)
  form.elements.namedItem('reason').value = 'New delivery'
  await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
  assert.equal(calls, 1)
  assert.equal(sessionStorage.getItem(key), null)
  assert.ok(page.container.querySelector('form'), 'Rejected adjustment remains editable')
})

test('storage failure or corrupt recovery blocks writes instead of discarding an unknown adjustment', async (t) => {
  setup()
  let calls = 0
  globalThis.__stockApi = async () => { calls++ }
  sessionStorage.setItem(key, '{corrupt')
  const page = await mount(t)
  assert.equal(page.container.querySelector('[aria-label="Adjust Rice"]').disabled, true)
  assert.match(page.container.textContent, /recovery data is unavailable/)
  assert.equal(calls, 0)
  await page.unmount()
  sessionStorage.clear()
  const next = await mount(t)
  const prototype = Object.getPrototypeOf(sessionStorage)
  const original = prototype.setItem
  prototype.setItem = () => { throw Error('Storage full') }
  try {
    await adjust(next.container)
    assert.equal(calls, 0)
    assert.match(next.container.textContent, /recovery data is unavailable/)
  } finally { prototype.setItem = original }
})
