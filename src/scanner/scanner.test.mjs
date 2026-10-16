import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSourceModule } from '../testing/sourceModule.mjs'
const { cameraMessage, stopCamera } = await import(
  await createSourceModule(import.meta.url)('./camera.ts')
)
test('camera denial missing hardware and busy device expose useful manual fallbacks', () => {
  for (const [name, text] of [
    ['NotAllowedError', 'permission'],
    ['NotFoundError', 'No camera'],
    ['NotReadableError', 'busy'],
  ]) {
    const error = new Error('camera')
    error.name = name
    assert.ok(cameraMessage(error).includes(text))
    assert.ok(cameraMessage(error).includes('barcode'))
  }
})
test('camera cleanup stops every stream track and tolerates absent streams', () => {
  let stopped = 0
  stopCamera({ getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }] })
  stopCamera(null)
  assert.equal(stopped, 2)
})
