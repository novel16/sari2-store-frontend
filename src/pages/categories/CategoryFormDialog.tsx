import type { FormEvent } from 'react'
import { Modal } from '../../components/ui'
import { FormField } from '../../components/ui/FormField'
import { fieldAttributes } from '../../components/ui/fieldAttributes'
import FormError from '../../auth/components/FormError'
import { catalogApi } from '../../catalog/api'
import { productIcons } from '../../catalog/constants'
import type { Category } from '../../catalog/types'
import { useMutation } from '../../hooks/useMutation'

export default function CategoryFormDialog({
  storeId,
  editing,
  onSaved,
  onClose,
}: {
  storeId: number
  editing: Category | 'new'
  onSaved: (name: string) => void
  onClose: () => void
}) {
  const category = editing === 'new' ? null : editing
  const { pending, error, fields, run } = useMutation()
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input = {
      name: String(data.get('name')).trim(),
      description: String(data.get('description')).trim() || null,
      emoji: String(data.get('emoji')),
    }
    if (await run(() => catalogApi.saveCategory(storeId, input, category?.id))) onSaved(input.name)
  }
  return (
    <Modal
      title={category ? 'Edit category' : 'Add a category'}
      onClose={() => {
        if (!pending) onClose()
      }}
    >
      <form onSubmit={(event) => void save(event)} aria-busy={pending}>
        <FormError error={error} />
        <fieldset disabled={pending} className="form-grid">
          <FormField label="Category name" name="name" errors={fields.name} wide>
            <input
              {...fieldAttributes('name', fields.name)}
              required
              maxLength={60}
              placeholder="e.g. Frozen goods"
              defaultValue={category?.name ?? ''}
            />
          </FormField>
          <FormField
            label="Short description (optional)"
            name="description"
            errors={fields.description}
            wide
          >
            <input
              {...fieldAttributes('description', fields.description)}
              maxLength={120}
              placeholder="A little description for your shelf"
              defaultValue={category?.description ?? ''}
            />
          </FormField>
          <FormField label="Shelf icon" name="emoji" errors={fields.emoji}>
            <select
              {...fieldAttributes('emoji', fields.emoji)}
              defaultValue={category?.emoji ?? '🛍️'}
            >
              {[...new Set([category?.emoji ?? '🛍️', ...productIcons])].map((emoji) => (
                <option key={emoji}>{emoji}</option>
              ))}
            </select>
          </FormField>
        </fieldset>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" disabled={pending} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save category'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
