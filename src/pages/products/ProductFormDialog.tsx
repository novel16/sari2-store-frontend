import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../../components/ui'
import { FormField } from '../../components/ui/FormField'
import { fieldAttributes } from '../../components/ui/fieldAttributes'
import { QueryState } from '../../components/ui/QueryState'
import FormError from '../../auth/components/FormError'
import { catalogApi } from '../../catalog/api'
import { productIcons, productUnits } from '../../catalog/constants'
import { useCategoryOptions } from '../../catalog/useCategoryOptions'
import type { Product, ProductInput } from '../../catalog/types'
import { useMutation } from '../../hooks/useMutation'
import { parseCentavos } from '../../lib/format'

type Props = {
  storeId: number
  editing: Product | 'new'
  onClose: () => void
  onSaved: (name: string) => void
}

export default function ProductFormDialog({ storeId, editing, onClose, onSaved }: Props) {
  const product = editing === 'new' ? null : editing
  const options = useCategoryOptions(storeId)
  const { pending, error, fields, run } = useMutation()
  const [localError, setLocalError] = useState('')
  const attr = (name: string, key = name) => fieldAttributes(name, fields[key])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    let input: ProductInput
    try {
      input = {
        name: String(data.get('name')).trim(),
        description: String(data.get('description')).trim() || null,
        category_id: data.get('category_id') ? Number(data.get('category_id')) : null,
        sku: String(data.get('sku')).trim() || null,
        barcode: String(data.get('barcode')).trim() || null,
        unit: String(data.get('unit')),
        emoji: String(data.get('emoji')),
        price_centavos: parseCentavos(String(data.get('price'))),
        cost_centavos: parseCentavos(String(data.get('cost'))),
        low_stock_threshold: Number(data.get('low_stock_threshold')),
        ...(!product ? { initial_stock: Number(data.get('initial_stock')) } : {}),
      }
    } catch (failure) {
      setLocalError(failure instanceof Error ? failure.message : 'Check the prices and try again.')
      return
    }
    setLocalError('')
    if (await run(() => catalogApi.saveProduct(storeId, input, product?.id))) onSaved(input.name)
  }

  return (
    <Modal
      title={product ? 'Edit product' : 'Add a product'}
      onClose={() => {
        if (!pending) onClose()
      }}
      wide
    >
      <QueryState loading={options.isLoading} error={options.error} retry={options.reload} />
      {options.data && (
        <form onSubmit={(event) => void save(event)} aria-busy={pending}>
          <FormError error={error} />
          {localError && (
            <p role="alert" className="mb-4 text-xs text-red-700">
              {localError}
            </p>
          )}
          <fieldset disabled={pending} className="form-grid">
            <FormField label="Product name" name="name" errors={fields.name} wide>
              <input
                {...attr('name')}
                required
                maxLength={120}
                placeholder="e.g. Lucky Me! Pancit Canton"
                defaultValue={product?.name ?? ''}
              />
            </FormField>
            <FormField
              label="Variant / description (optional)"
              name="description"
              errors={fields.description}
            >
              <input
                {...attr('description')}
                maxLength={255}
                placeholder="Original · 60g"
                defaultValue={product?.description ?? ''}
              />
            </FormField>
            <FormField label="Category" name="category_id" errors={fields.category_id}>
              <select {...attr('category_id')} defaultValue={product?.category?.id ?? ''}>
                <option value="">Uncategorized</option>
                {product?.category?.status === 'archived' && (
                  <option value={product.category.id}>
                    {product.category.name} (archived — choose another)
                  </option>
                )}
                {options.data.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Selling price (₱)" name="price" errors={fields.price_centavos}>
              <input
                {...attr('price', 'price_centavos')}
                type="number"
                required
                min="0"
                max="10000000"
                step="0.01"
                placeholder="0.00"
                defaultValue={product ? (product.price_centavos / 100).toFixed(2) : ''}
              />
            </FormField>
            <FormField label="Cost price (₱)" name="cost" errors={fields.cost_centavos}>
              <input
                {...attr('cost', 'cost_centavos')}
                type="number"
                required
                min="0"
                max="10000000"
                step="0.01"
                placeholder="0.00"
                defaultValue={product ? (product.cost_centavos / 100).toFixed(2) : ''}
              />
            </FormField>
            {!product && (
              <FormField label="Opening stock" name="initial_stock" errors={fields.initial_stock}>
                <input
                  {...attr('initial_stock')}
                  type="number"
                  required
                  min="0"
                  max="1000000000"
                  step="1"
                  defaultValue="0"
                />
              </FormField>
            )}
            <FormField
              label="Low-stock alert at"
              name="low_stock_threshold"
              errors={fields.low_stock_threshold}
            >
              <input
                {...attr('low_stock_threshold')}
                type="number"
                required
                min="0"
                max="1000000000"
                step="1"
                defaultValue={product?.low_stock_threshold ?? 10}
              />
            </FormField>
            <FormField label="Unit" name="unit" errors={fields.unit}>
              <select {...attr('unit')} defaultValue={product?.unit ?? 'piece'}>
                {productUnits.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Product icon" name="emoji" errors={fields.emoji}>
              <select {...attr('emoji')} defaultValue={product?.emoji ?? '🛍️'}>
                {[...new Set([product?.emoji ?? '🛍️', ...productIcons])].map((emoji) => (
                  <option key={emoji}>{emoji}</option>
                ))}
              </select>
            </FormField>
            <FormField label="SKU (optional)" name="sku" errors={fields.sku}>
              <input
                {...attr('sku')}
                maxLength={64}
                pattern="[A-Za-z0-9._\-]+"
                placeholder="e.g. NOODLES-001"
                defaultValue={product?.sku ?? ''}
              />
            </FormField>
            <FormField label="Barcode (optional)" name="barcode" errors={fields.barcode}>
              <input
                {...attr('barcode')}
                maxLength={64}
                pattern="[A-Za-z0-9._\-]+"
                placeholder="Leading zeros are preserved"
                defaultValue={product?.barcode ?? ''}
              />
            </FormField>
          </fieldset>
          <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
            {product ? (
              <>
                Stock on hand: {product.inventory.quantity_on_hand}. Use{' '}
                <Link to="/inventory" className="font-semibold text-forest underline">
                  Inventory
                </Link>{' '}
                to record a stock change.
              </>
            ) : (
              'Opening stock will be recorded in your inventory history.'
            )}
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? 'Saving…' : product ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
