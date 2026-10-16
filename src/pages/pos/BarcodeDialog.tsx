import { useState } from 'react'
import { useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { Barcode } from 'lucide-react'
import { Modal } from '../../components/ui'
import FormError from '../../auth/components/FormError'
import { AuthError } from '../../auth/errors'
import { http } from '../../api/http'
import { storePath } from '../../catalog/api'
import type { Product } from '../../catalog/types'
import { useMutation } from '../../hooks/useMutation'
import CameraScanner from '../../scanner/CameraScanner'

export default function BarcodeDialog({
  storeId,
  onMatch,
  onClose,
}: {
  storeId: number
  onMatch: (product: Product) => void
  onClose: () => void
}) {
  const [barcode, setBarcode] = useState('')
  const [camera, setCamera] = useState(false)
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const { pending, error, run } = useMutation()
  async function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCamera(false)
    await lookup(barcode)
  }
  async function lookup(value: string) {
    let product: Product | null = null
    const success = await run(async () => {
      try {
        product = (
          await http.get<{ data: Product }>(`${storePath(storeId)}/products/lookup`, {
            params: { barcode: value.trim() },
          })
        ).data.data
      } catch (failure) {
        if (axios.isAxiosError(failure) && failure.response?.status === 404)
          throw new AuthError('Product not registered. Check the barcode or search by name.', 404)
        throw failure
      }
      if (!product.inventory.quantity_on_hand)
        throw new AuthError('This product is currently out of stock.', 409)
    })
    if (success && product && active.current) {
      onMatch(product)
      onClose()
    }
  }
  return (
    <Modal
      title="Find by barcode"
      onClose={() => {
        if (!pending) {
          active.current = false
          onClose()
        }
      }}
      dismissible={!pending}
    >
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-paper p-4 text-xs text-stone-600">
        <Barcode size={28} className="shrink-0 text-forest" />
        Type the full barcode, or use a keyboard scanner and press Enter.
      </div>
      {camera ? (
        <CameraScanner
          onStop={() => setCamera(false)}
          onCode={(value) => {
            setBarcode(value)
            setCamera(false)
            void lookup(value)
          }}
        />
      ) : (
        <button
          type="button"
          disabled={pending}
          className="btn btn-secondary mb-4"
          onClick={() => setCamera(true)}
        >
          Use camera scanner
        </button>
      )}
      <form onSubmit={(event) => void find(event)}>
        <FormError error={error} />
        <label className="field mt-4">
          <span>Product barcode</span>
          <input
            name="barcode"
            data-autofocus
            value={barcode}
            maxLength={64}
            required
            disabled={pending}
            autoComplete="off"
            onChange={(event) => setBarcode(event.target.value)}
            placeholder="e.g. 001234567890"
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" disabled={pending} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Finding…' : 'Find & add to cart'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
