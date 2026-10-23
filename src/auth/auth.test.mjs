import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { afterEach, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { createSourceModule } from '../testing/sourceModule.mjs'

const require = createRequire(import.meta.url)
const axiosUrl = pathToFileURL(require.resolve('axios')).href

const sourceModule = createSourceModule(import.meta.url)

const httpUrl = await sourceModule(
  '../api/http.ts',
  { axios: axiosUrl },
  {
    'import.meta.env': '({ VITE_API_URL: "http://localhost:8000" })',
  },
)
const { http, writeWithCsrf } = await import(httpUrl)
const apiUrl = await sourceModule('./authApi.ts', { axios: axiosUrl, '../api/http': httpUrl })
const { authApi } = await import(apiUrl)
const errorsUrl = await sourceModule('./errors.ts', { axios: axiosUrl })
const { toAuthError } = await import(errorsUrl)
const { safeReturnTo, returnToFromState, authDestination } = await import(
  await sourceModule('./returnTo.ts')
)
const { default: axios } = await import(axiosUrl)
const originalAdapter = http.defaults.adapter

function response(config, data, status = 200) {
  return { data, status, statusText: String(status), headers: {}, config }
}

function failure(config, status, data = {}) {
  return new axios.AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    config,
    {},
    response(config, data, status),
  )
}

afterEach(() => {
  http.defaults.adapter = originalAdapter
})

for (const method of ['patch', 'delete']) {
  test(`${method} mutations establish CSRF and send credentials without replaying a network failure`, async () => {
    const requests = []
    http.defaults.adapter = async (config) => {
      requests.push(config)
      if (config.method === method) throw new axios.AxiosError('Network Error')
      return response(config, undefined, 204)
    }
    await assert.rejects(writeWithCsrf(method, '/api/v1/stores/1/products/2'))
    assert.equal(requests.length, 2)
    assert.equal(requests[0].url, '/sanctum/csrf-cookie')
    assert.equal(requests[1].method, method)
    assert.equal(requests[1].withCredentials, true)
    assert.equal(requests[1].withXSRFToken, true)
  })
}

test('return paths keep workspace locations and reject external or auth locations', () => {
  assert.equal(safeReturnTo('/products?q=rice#shelf'), '/products?q=rice#shelf')
  assert.equal(returnToFromState({ returnTo: '/inventory' }), '/inventory')
  for (const path of [
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/login',
    '/reset-password?token=secret',
    '/unknown',
    '/products\n',
    null,
    {},
  ]) {
    assert.equal(safeReturnTo(path), '/dashboard')
  }
})

test('login first requests CSRF cookies, sends credentials and unwraps the user', async () => {
  const requests = []
  const user = {
    id: 8,
    name: 'Maria',
    email: 'maria@example.com',
    platform_role: 'user',
    accounts: [],
  }
  http.defaults.adapter = async (config) => {
    requests.push(config)
    return response(config, config.url === '/login' ? { data: user } : undefined)
  }
  const result = await authApi.login({ email: user.email, password: 'password123', remember: true })
  assert.deepEqual(result, user)
  assert.deepEqual(
    requests.map(({ method, url }) => [method, url]),
    [
      ['get', '/sanctum/csrf-cookie'],
      ['post', '/login'],
    ],
  )
  assert.deepEqual(JSON.parse(requests[1].data), {
    email: user.email,
    password: 'password123',
    remember: true,
  })
  assert.equal(requests[1].withCredentials, true)
  assert.equal(requests[1].withXSRFToken, true)
})

test('expired CSRF refreshes once and retries the same mutation', async () => {
  const paths = []
  let attempts = 0
  http.defaults.adapter = async (config) => {
    paths.push(config.url)
    if (config.url === '/forgot-password' && attempts++ === 0) throw failure(config, 419)
    return response(config, { message: 'Check your email.' })
  }
  await authApi.forgotPassword('owner@example.com')
  assert.deepEqual(paths, [
    '/sanctum/csrf-cookie',
    '/forgot-password',
    '/sanctum/csrf-cookie',
    '/forgot-password',
  ])
})

test('a repeated CSRF error stops after one retry', async () => {
  let mutations = 0
  http.defaults.adapter = async (config) => {
    if (config.url === '/logout') {
      mutations += 1
      throw failure(config, 419)
    }
    return response(config, undefined, 204)
  }
  await assert.rejects(authApi.logout(), (error) => error.response.status === 419)
  assert.equal(mutations, 2)
})

test('validation failures are not retried and retain field errors', async () => {
  let mutations = 0
  http.defaults.adapter = async (config) => {
    if (config.url === '/register') {
      mutations += 1
      throw failure(config, 422, { errors: { email: ['This email is already registered.'] } })
    }
    return response(config, undefined, 204)
  }
  await assert.rejects(
    authApi.register({
      name: 'Maria',
      store_name: 'Maria Store',
      email: 'maria@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    }),
    (failure) => {
      const error = toAuthError(failure)
      assert.equal(error.status, 422)
      assert.deepEqual(error.fields.email, ['This email is already registered.'])
      return true
    },
  )
  assert.equal(mutations, 1)
})

test('session restore requests the authenticated me endpoint without storing tokens', async () => {
  const user = { id: 8, accounts: [] }
  http.defaults.adapter = async (config) => {
    assert.equal(config.method, 'get')
    assert.equal(config.url, '/api/v1/me')
    return response(config, { data: user })
  }
  assert.deepEqual(await authApi.me(), user)
})

test('network, expired session, rate limit, and forbidden errors have readable messages', () => {
  assert.match(toAuthError(new axios.AxiosError('Network Error')).message, /connect/i)
  assert.match(toAuthError(failure({}, 419)).message, /expired/i)
  assert.match(toAuthError(failure({}, 429)).message, /wait/i)
  assert.match(toAuthError(failure({}, 403)).message, /access/i)
})

test('client access accepts active owners and rejects admin, inactive or unassigned accounts', async () => {
  const { canAccessClient } = await import(await sourceModule('./clientAccess.ts'))
  const owner = {
    id: 1,
    name: 'Maria',
    email: 'maria@example.com',
    platform_role: 'user',
    status: 'active',
    accounts: [{ id: 1, role: 'owner', status: 'active', stores: [{ id: 1, status: 'active' }] }],
  }
  assert.equal(canAccessClient(owner), true)
  assert.equal(canAccessClient({ ...owner, platform_role: 'platform_admin' }), false)
  assert.equal(canAccessClient({ ...owner, status: 'suspended' }), false)
  assert.equal(canAccessClient({ ...owner, status: undefined }), false)
  assert.equal(canAccessClient({ ...owner, accounts: [] }), false)
  assert.equal(
    canAccessClient({ ...owner, accounts: [{ ...owner.accounts[0], role: 'staff' }] }),
    false,
  )
  assert.equal(
    canAccessClient({ ...owner, accounts: [{ ...owner.accounts[0], status: 'suspended' }] }),
    false,
  )
  assert.equal(
    canAccessClient({
      ...owner,
      accounts: [{ ...owner.accounts[0], stores: [{ id: 1, status: 'inactive' }] }],
    }),
    false,
  )
})

test('public Basic signup intent and authenticated payment return paths keep their internal destinations', () => {
  const order = '8e0a7515-2d4c-493a-bd38-399b5192818a'
  assert.equal(authDestination(null, '?plan=basic'), '/subscription/checkout?plan=basic')
  assert.equal(authDestination(null, '?plan=https://evil.test'), '/dashboard')
  assert.equal(
    safeReturnTo('/subscription/checkout?plan=basic'),
    '/subscription/checkout?plan=basic',
  )
  assert.equal(
    safeReturnTo('/subscription/payments/' + order + '?payment=return'),
    '/subscription/payments/' + order + '?payment=return',
  )
  assert.equal(safeReturnTo('/subscription/payments/invalid'), '/dashboard')
  assert.equal(safeReturnTo('//evil.test/subscription/checkout'), '/dashboard')
})
