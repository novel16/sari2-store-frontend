import assert from 'node:assert/strict'
import test from 'node:test'
import { createSourceModule } from '../testing/sourceModule.mjs'
const sourceModule = createSourceModule(import.meta.url)
const { productAllowance, ownerAccess, usagePercent, subscriptionPath } = await import(
  await sourceModule('./format.ts')
)
test('plan labels use saved limits and distinguish pooled and per-store allowances', () => {
  assert.equal(
    productAllowance({ active_product_limit: 3000, quota_scope: 'account' }),
    '3,000 active products across all stores',
  )
  assert.equal(
    productAllowance({ active_product_limit: 500, quota_scope: 'store' }),
    '500 active products per store',
  )
  assert.match(productAllowance({ active_product_limit: null, quota_scope: 'store' }), /Unlimited/)
  assert.equal(ownerAccess({ store_limit: 1, staff_limit: 0 }), '1 store · owner only')
  assert.equal(ownerAccess({ store_limit: 3, staff_limit: 5 }), '3 stores · owner + 5 staff')
})
test('usage bars handle over-limit and unlimited plans and use the authorized store path', () => {
  assert.equal(usagePercent(50, 100), 50)
  assert.equal(usagePercent(150, 100), 100)
  assert.equal(usagePercent(50, null), 0)
  assert.equal(usagePercent(-1, 100), 0)
  assert.equal(subscriptionPath(7), '/api/v1/stores/7/subscription')
})
