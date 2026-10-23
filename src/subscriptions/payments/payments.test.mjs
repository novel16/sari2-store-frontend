import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { after, beforeEach, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import axios from 'axios'
import { act, createElement, useState } from 'react'
import { installDom } from '../../testing/dom.mjs'
import { createSourceModule } from '../../testing/sourceModule.mjs'

const require = createRequire(import.meta.url)
const source = createSourceModule(import.meta.url)
const imports = Object.fromEntries(
  ['react', 'react/jsx-runtime', 'lucide-react', 'react-router-dom'].map((name) => [
    name,
    pathToFileURL(require.resolve(name)).href,
  ]),
)
imports['react-router-dom'] = import.meta.resolve('react-router-dom')
const dom = installDom()
after(() => dom.cleanup())
const { createRoot } = await import('react-dom/client')
const checkoutUrl = await source('./checkout.ts')
const { safeCheckoutUrl, orderMessage, resumableCheckoutUrl, paymentPath } = await import(
  checkoutUrl
)
const recoveryUrl = await source('./recovery.ts', { './checkout': checkoutUrl })
const { readPurchase, purchaseStorageKey } = await import(recoveryUrl)
const formatUrl = await source('../../lib/format.ts')
const authErrorUrl = await source('../../auth/errors.ts', { axios: import.meta.resolve('axios') })
const errorsUrl = await source('../../api/errors.ts', {
  axios: import.meta.resolve('axios'),
  '../auth/errors': authErrorUrl,
})
const httpUrl = await source(
  '../../api/http.ts',
  { axios: import.meta.resolve('axios') },
  { 'import.meta.env.VITE_API_URL': "'http://localhost:8000'" },
)
const { http } = await import(httpUrl)
const apiUrl = await source('./api.ts', { '../../api/http': httpUrl })
const purchaseHookUrl = await source('./usePurchase.ts', {
  ...imports,
  axios: import.meta.resolve('axios'),
  '../../api/errors': errorsUrl,
  '../../auth/errors': authErrorUrl,
  '../../auth/useAuth': 'data:text/javascript,export const useAuth=()=>globalThis.__billingAuth',
  './api': apiUrl,
  './recovery': recoveryUrl,
})
const { usePurchase } = await import(purchaseHookUrl)
const subscriptionFormatUrl = await source('../format.ts')
const { PageHeader } = await import(await source('../../components/ui/PageHeader.tsx', imports))
globalThis.__billingPageHeader = PageHeader
const uiUrl = 'data:text/javascript,export const PageHeader=globalThis.__billingPageHeader'
const formUrl = await source('./PurchaseForm.tsx', {
  ...imports,
  '../../components/ui': uiUrl,
  '../../lib/format': formatUrl,
  '../format': subscriptionFormatUrl,
})
const { default: PurchaseForm } = await import(formUrl)
const orderStatusUrl = await source('./OrderStatus.tsx', {
  ...imports,
  '../../lib/format': formatUrl,
  '../../api/errors': errorsUrl,
  './api': apiUrl,
  './checkout': checkoutUrl,
})
const { default: OrderStatus } = await import(orderStatusUrl)
const queryStateUrl = await source('../../components/ui/QueryState.tsx', imports)
const queryUrl = await source('../../hooks/useStoreQuery.ts', {
  ...imports,
  axios: import.meta.resolve('axios'),
  '../api/http': httpUrl,
  '../api/errors': errorsUrl,
  '../auth/useAuth': 'data:text/javascript,export const useAuth=()=>globalThis.__billingAuth',
})
const orderPanelUrl = await source('./PaymentOrderPanel.tsx', {
  ...imports,
  '../../api/http': httpUrl,
  '../../components/ui/QueryState': queryStateUrl,
  '../../hooks/useStoreQuery': queryUrl,
  './api': apiUrl,
  './OrderStatus': orderStatusUrl,
})
const { default: SubscriptionPaymentPage } = await import(
  await source('../../pages/subscription/SubscriptionPaymentPage.tsx', {
    ...imports,
    '../../components/ui': uiUrl,
    '../../hooks/useWorkspace':
      'data:text/javascript,export const useWorkspace=()=>({user:{id:4},store:{id:7}})',
    '../../subscriptions/payments/checkout': checkoutUrl,
    '../../subscriptions/payments/PaymentOrderPanel': orderPanelUrl,
  })
)
const recoveryViewUrl = await source('./PurchaseRecovery.tsx', imports)
const { default: SubscriptionCheckoutPage } = await import(
  await source(
    '../../pages/subscription/SubscriptionCheckoutPage.tsx',
    {
      ...imports,
      '../../components/ui': uiUrl,
      '../../components/ui/QueryState': queryStateUrl,
      '../../hooks/useStoreQuery': queryUrl,
      '../../hooks/useWorkspace':
        'data:text/javascript,export const useWorkspace=()=>({user:{id:4},store:{id:7}})',
      '../../subscriptions/format': subscriptionFormatUrl,
      '../../subscriptions/payments/checkout': checkoutUrl,
      '../../subscriptions/payments/usePurchase': purchaseHookUrl,
      '../../subscriptions/payments/PurchaseForm': formUrl,
      '../../subscriptions/payments/PurchaseRecovery': recoveryViewUrl,
    },
    { 'window.location.assign(checkout)': 'globalThis.__checkoutRedirect(checkout)' },
  )
)
const { default: SubscriptionPage } = await import(
  await source('../../pages/subscription/SubscriptionPage.tsx', {
    ...imports,
    '../../hooks/useWorkspace':
      'data:text/javascript,export const useWorkspace=()=>({user:{id:4},store:{id:7}})',
    '../../subscriptions/payments/checkout': checkoutUrl,
    './SubscriptionWorkspace': 'data:text/javascript,export default ()=>null',
  })
)
const { MemoryRouter, Routes, Route, useLocation } = await import('react-router-dom')
const order = {
  id: '8e0a7515-2d4c-493a-bd38-399b5192818a',
  account_id: 3,
  plan: { id: 2, version: 3, code: 'basic', name: 'Basic saved' },
  months: 2,
  amount_centavos: 9800,
  currency: 'PHP',
  payment_status: 'pending',
  fulfillment_status: 'pending',
  checkout_url: 'https://checkout.paymongo.com/cs_test_safe',
  can_resume: true,
  can_cancel: true,
  expires_at: '2026-10-18T05:00:00Z',
  created_at: '2026-10-18T04:00:00Z',
  paid_at: null,
  fulfilled_at: null,
  issue_code: null,
  subscription: null,
}
const plan = {
  id: 2,
  version: 3,
  name: 'Basic',
  code: 'basic',
  catalog_status: 'published',
  monthly_price_centavos: 4900,
  active_product_limit: 500,
  quota_scope: 'store',
  store_limit: 1,
  staff_limit: 0,
}
let calls, handler, lastHook, redirects, location
const reply = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
beforeEach(() => {
  calls = []
  sessionStorage.clear()
  redirects = []
  globalThis.__checkoutRedirect = (url) => redirects.push(url)
  globalThis.__billingAuth = { refresh: async () => {} }
  handler = (config) => reply(config, config.url === '/sanctum/csrf-cookie' ? {} : { data: order })
  http.defaults.adapter = async (config) => {
    calls.push(config)
    return handler(config)
  }
})
async function mount(t, component) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  t.after(async () => {
    await act(async () => root.unmount())
    container.remove()
  })
  await act(async () => root.render(component))
  return container
}
const button = (container, label) =>
  [...container.querySelectorAll('button')].find((element) => element.textContent === label)
async function click(element) {
  assert.ok(element)
  await act(async () => element.click())
}

function LocationProbe() {
  location = useLocation()
  return null
}
async function mountCheckout(t, initialEntry = '/subscription/checkout?plan=basic') {
  return mount(
    t,
    createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      createElement(LocationProbe),
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: '/subscription/checkout',
          element: createElement(SubscriptionCheckoutPage),
        }),
        createElement(Route, { path: '/subscription', element: createElement(SubscriptionPage) }),
        createElement(Route, {
          path: '/subscription/payments/:orderId',
          element: createElement('h1', null, 'Payment status'),
        }),
      ),
    ),
  )
}
function checkoutHandler(nextOrder = order) {
  handler = (config) =>
    reply(
      config,
      config.url === '/sanctum/csrf-cookie'
        ? {}
        : config.url === '/api/v1/stores/7/subscription'
          ? { data: { plans: [plan], billing_available: true, pending_order: null } }
          : { data: nextOrder },
    )
}

test('checkout navigation accepts only exact HTTPS PayMongo hosted checkout links', () => {
  assert.equal(safeCheckoutUrl(order.checkout_url), order.checkout_url)
  for (const value of [
    'http://checkout.paymongo.com/a',
    'https://checkout.paymongo.com.evil.test/a',
    'https://evil.test',
    '//checkout.paymongo.com/a',
    'javascript:alert(1)',
    'https://x@checkout.paymongo.com/a',
    'https://checkout.paymongo.com:8443/a',
    null,
  ])
    assert.equal(safeCheckoutUrl(value), null)
})
test('checkout recovery is scoped to actor/store and ignores malformed or secret extra fields', () => {
  const input = { request_key: order.id, plan_id: 2, expected_plan_version: 3, months: 2 }
  assert.deepEqual(
    readPurchase({ getItem: () => JSON.stringify({ ...input, secret: 'discard' }) }, 'key'),
    input,
  )
  assert.notEqual(purchaseStorageKey(1, 2), purchaseStorageKey(2, 2))
  assert.notEqual(purchaseStorageKey(1, 2), purchaseStorageKey(1, 3))
  for (const value of [
    { ...input, months: 13 },
    { ...input, months: 1.5 },
    { ...input, plan_id: -1 },
    { ...input, expected_plan_version: 0 },
    { ...input, request_key: 'bad' },
    null,
  ])
    assert.equal(readPurchase({ getItem: () => JSON.stringify(value) }, 'key'), null)
})
test('checkout form updates its summary and submits without a modal or extra review step', async (t) => {
  const confirms = []
  const container = await mount(
    t,
    createElement(PurchaseForm, {
      plan,
      pending: false,
      error: null,
      onConfirm: (months) => confirms.push(months),
    }),
  )
  await act(async () => {
    const select = container.querySelector('select')
    select.value = '2'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  assert.match(container.textContent, /98\.00/)
  assert.equal(container.querySelector('[role=dialog]'), null)
  assert.equal(button(container, 'Review payment'), undefined)
  assert.equal(container.querySelector('select').disabled, false)
  assert.equal(confirms.length, 0)
  await click(button(container, 'Proceed to QR Ph payment'))
  assert.deepEqual(confirms, [2])
})
test('proceed creates one checkout and redirects immediately to PayMongo with a status page in history', async (t) => {
  checkoutHandler()
  const container = await mountCheckout(t)
  assert.equal(calls.filter((config) => config.method === 'post').length, 0)
  await act(async () => {
    const select = container.querySelector('select')
    select.value = '2'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await click(button(container, 'Proceed to QR Ph payment'))
  const posts = calls.filter((config) => config.method === 'post')
  assert.equal(posts.length, 1)
  assert.equal(JSON.parse(posts[0].data).months, 2)
  assert.deepEqual(redirects, [order.checkout_url])
  assert.equal(location.pathname, paymentPath(order.id))
  assert.equal(sessionStorage.length, 0)
})
for (const [name, changes] of [
  ['unknown checkout', { payment_status: 'unknown', checkout_url: null, can_resume: false }],
  ['already paid order', { payment_status: 'paid', fulfillment_status: 'fulfilled' }],
  ['untrusted URL', { checkout_url: 'https://evil.test' }],
  ['failed checkout', { payment_status: 'failed' }],
]) {
  test(`${name} opens its status page without an external redirect`, async (t) => {
    const value = { ...order, ...changes }
    checkoutHandler(value)
    const container = await mountCheckout(t)
    await click(button(container, 'Proceed to QR Ph payment'))
    assert.equal(resumableCheckoutUrl(value), null)
    assert.equal(location.pathname, paymentPath(order.id))
    assert.deepEqual(redirects, [])
  })
}
test('an existing pending payment opens its status instead of creating another checkout', async (t) => {
  handler = (config) =>
    reply(config, { data: { plans: [plan], billing_available: true, pending_order: order } })
  await mountCheckout(t)
  assert.equal(location.pathname, paymentPath(order.id))
  assert.equal(calls.filter((config) => config.method === 'post').length, 0)
  assert.deepEqual(redirects, [])
})
test('an unavailable plan cannot create a payment through a direct checkout URL', async (t) => {
  checkoutHandler()
  const container = await mountCheckout(t, '/subscription/checkout?plan=pro')
  assert.match(container.textContent, /This checkout is unavailable/)
  assert.equal(button(container, 'Proceed to QR Ph payment'), undefined)
  assert.equal(calls.filter((config) => config.method === 'post').length, 0)
})
test('a lost response keeps recovery on the checkout page and retries the original request', async (t) => {
  checkoutHandler()
  const normal = handler
  let attempts = 0
  handler = (config) => {
    if (config.method === 'post' && ++attempts === 1)
      throw new axios.AxiosError('Timeout', 'ECONNABORTED', config)
    return normal(config)
  }
  const container = await mountCheckout(t)
  await click(button(container, 'Proceed to QR Ph payment'))
  assert.match(container.textContent, /Recover your checkout/)
  assert.deepEqual(redirects, [])
  const original = JSON.parse(calls.find((config) => config.method === 'post').data)
  await click(button(container, 'Retry same checkout'))
  const posts = calls.filter((config) => config.method === 'post')
  assert.deepEqual(JSON.parse(posts[1].data), original)
  assert.deepEqual(redirects, [order.checkout_url])
  assert.equal(location.pathname, paymentPath(order.id))
})
test('older PayMongo return URLs open the order page without returning users to checkout', async (t) => {
  await mountCheckout(t, `/subscription?order=${order.id}&payment=back`)
  assert.equal(location.pathname, paymentPath(order.id))
  assert.equal(location.search, '?payment=back')
  assert.equal(calls.length, 0)
  assert.deepEqual(redirects, [])
})
test('the payment return page reads the saved order without assuming payment or reopening checkout', async (t) => {
  const container = await mount(
    t,
    createElement(
      MemoryRouter,
      {
        initialEntries: [`${paymentPath(order.id)}?payment=return`],
      },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: '/subscription/payments/:orderId',
          element: createElement(SubscriptionPaymentPage),
        }),
      ),
    ),
  )
  assert.match(container.textContent, /Waiting for payment confirmation/)
  assert.doesNotMatch(container.textContent, /Subscription activated/)
  assert.equal(
    container.querySelector('a[href^="https://checkout.paymongo.com"]').href,
    order.checkout_url,
  )
  assert.ok(calls.some((config) => config.url.endsWith(`/${order.id}`)))
  assert.ok(calls.every((config) => config.method === 'get'))
  assert.deepEqual(redirects, [])
})
test('order status has trusted resume and cancellation review without client paid mutation', async (t) => {
  const container = await mount(
    t,
    createElement(OrderStatus, {
      order,
      storeId: 7,
      checking: false,
      onRefresh: () => {},
      onChanged: () => {},
    }),
  )
  assert.equal(container.querySelector('a').href, order.checkout_url)
  assert.match(container.textContent, /1:00 PM/)
  await click(button(container, 'Cancel unpaid checkout'))
  assert.equal(calls.length, 0)
  await click(button(container, 'Confirm cancellation'))
  assert.ok(
    calls.some(
      (config) =>
        config.method === 'post' &&
        config.url === `/api/v1/stores/7/subscription/orders/${order.id}/expire`,
    ),
  )
  assert.ok(!calls.some((config) => /mark.*paid/.test(config.url)))
})
test('paid processing warns against another payment and keeps activation separate', async (t) => {
  const paid = {
    ...order,
    payment_status: 'paid',
    fulfillment_status: 'needs_attention',
    can_resume: true,
    can_cancel: false,
  }
  const container = await mount(
    t,
    createElement(OrderStatus, {
      order: paid,
      storeId: 7,
      checking: false,
      onRefresh: () => {},
      onChanged: () => {},
    }),
  )
  assert.equal(container.querySelector('a'), null)
  assert.match(container.textContent, /Do not pay again/)
  assert.match(container.textContent, /Payment received; activation needs attention/)
  assert.match(orderMessage({ ...paid, fulfillment_status: 'fulfilled' }), /activated/)
})
function Harness({ onCreated }) {
  lastHook = usePurchase(4, 7, onCreated)
  return createElement('button', { onClick: () => lastHook.purchase(plan, 2) }, 'Purchase')
}
test('leaving during checkout creation preserves recovery and ignores a late navigation callback', async (t) => {
  const saved = []
  let finish, leave
  handler = (config) =>
    config.method === 'post'
      ? new Promise((resolve) => {
          finish = () => resolve(reply(config, { data: order }))
        })
      : reply(config, {})
  function Page() {
    const [visible, setVisible] = useState(true)
    leave = () => setVisible(false)
    return visible ? createElement(Harness, { onCreated: (value) => saved.push(value) }) : null
  }
  const container = await mount(t, createElement(Page))
  await click(button(container, 'Purchase'))
  const original = sessionStorage.getItem(purchaseStorageKey(4, 7))
  assert.ok(original)
  await act(async () => leave())
  await act(async () => finish())
  assert.deepEqual(saved, [])
  assert.equal(sessionStorage.getItem(purchaseStorageKey(4, 7)), original)
})
test('lost checkout response remains recoverable and exact same request key is reused', async (t) => {
  const saved = []
  let attempts = 0
  handler = (config) => {
    if (config.url === '/sanctum/csrf-cookie') return reply(config, {})
    if (config.method === 'post' && ++attempts === 1)
      throw new axios.AxiosError('Timeout', 'ECONNABORTED', config)
    return reply(config, { data: order })
  }
  const container = await mount(
    t,
    createElement(Harness, { onCreated: (value) => saved.push(value) }),
  )
  await click(button(container, 'Purchase'))
  assert.equal(saved.length, 0)
  assert.ok(lastHook.attempt)
  const first = JSON.parse(calls.find((config) => config.method === 'post').data)
  await act(async () => lastHook.retry())
  const posts = calls.filter((config) => config.method === 'post')
  assert.equal(posts.length, 2)
  assert.deepEqual(JSON.parse(posts[1].data), first)
  assert.equal(first.months, 2)
  assert.equal(first.expected_plan_version, 3)
  assert.equal(saved.length, 1)
  assert.equal(lastHook.attempt, null)
  assert.equal(sessionStorage.length, 0)
})
test('restored checkout first checks by key and never creates a new payment automatically', async (t) => {
  const input = { request_key: order.id, plan_id: 2, expected_plan_version: 3, months: 2 }
  sessionStorage.setItem(purchaseStorageKey(4, 7), JSON.stringify(input))
  const saved = []
  await mount(t, createElement(Harness, { onCreated: (value) => saved.push(value) }))
  assert.equal(calls.length, 0)
  await act(async () => lastHook.check())
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'get')
  assert.ok(calls[0].url.endsWith(`/by-key/${order.id}`))
  assert.equal(saved.length, 1)
})
test('untrusted checkout URL cannot become a clickable payment link', async (t) => {
  const container = await mount(
    t,
    createElement(OrderStatus, {
      order: { ...order, checkout_url: 'https://evil.test' },
      storeId: 7,
      checking: false,
      onRefresh: () => {},
      onChanged: () => {},
    }),
  )
  assert.equal(container.querySelector('a'), null)
  assert.match(container.querySelector('[role=alert]').textContent, /link is unavailable/)
})

test('a changed plan offer releases the unsaved attempt and requests a fresh catalog review', async (t) => {
  let reloads = 0
  handler = (config) => {
    if (config.url === '/sanctum/csrf-cookie') return reply(config, {})
    throw new axios.AxiosError('Offer changed', 'ERR_BAD_REQUEST', config, null, {
      status: 409,
      data: {
        code: 'subscription_offer_changed',
        message: 'This offer changed. Refresh and review it again.',
      },
    })
  }
  function ChangedOffer() {
    lastHook = usePurchase(
      4,
      7,
      () => assert.fail('No order should exist'),
      () => {
        reloads++
      },
    )
    return createElement('button', { onClick: () => lastHook.purchase(plan, 1) }, 'Purchase')
  }
  const container = await mount(t, createElement(ChangedOffer))
  await click(button(container, 'Purchase'))
  assert.equal(lastHook.attempt, null)
  assert.equal(sessionStorage.length, 0)
  assert.equal(reloads, 1)
  assert.match(lastHook.error.message, /offer changed/)
})

test('request-key conflicts keep the original attempt for lookup instead of creating another key', async (t) => {
  handler = (config) => {
    if (config.url === '/sanctum/csrf-cookie') return reply(config, {})
    throw new axios.AxiosError('Key conflict', 'ERR_BAD_REQUEST', config, null, {
      status: 409,
      data: { code: 'subscription_order_key_conflict', message: 'Check this order first.' },
    })
  }
  const container = await mount(t, createElement(Harness, { onCreated: () => {} }))
  await click(button(container, 'Purchase'))
  assert.ok(lastHook.attempt)
  const saved = readPurchase(sessionStorage, purchaseStorageKey(4, 7))
  assert.equal(saved.request_key, lastHook.attempt.request_key)
  await click(button(container, 'Purchase'))
  assert.equal(calls.filter((config) => config.method === 'post').length, 1)
})

test('fulfilled future coverage is described as a scheduled renewal', () => {
  assert.equal(
    orderMessage({
      ...order,
      fulfillment_status: 'fulfilled',
      subscription: { starts_at: '2099-01-01T00:00:00Z' },
    }),
    'Renewal scheduled',
  )
})
