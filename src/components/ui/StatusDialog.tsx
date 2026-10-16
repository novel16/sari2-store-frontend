import { useMutation } from '../../hooks/useMutation'
import { Modal } from './Modal'
import FormError from '../../auth/components/FormError'

export function StatusDialog({
  name,
  archived,
  action,
  onClose,
  onSaved,
}: {
  name: string
  archived: boolean
  action: () => Promise<unknown>
  onClose: () => void
  onSaved: () => void
}) {
  const { pending, error, run } = useMutation()
  async function confirm() {
    if (await run(action)) onSaved()
  }
  return (
    <Modal
      title={archived ? 'Restore this item?' : 'Archive this item?'}
      onClose={() => {
        if (!pending) onClose()
      }}
    >
      <p className="mb-5 text-sm leading-relaxed text-stone-600">
        {archived
          ? `${name} will become active again. Product limits still apply.`
          : `${name} will leave your active list. Its records and stock history will be kept, and you can restore it later.`}
      </p>
      <FormError error={error} />
      {error?.fields.category_id?.map((message) => (
        <p key={message} role="alert" className="mt-2 text-xs text-red-700">
          {message} Edit the product to choose a different category, or restore its category first.
        </p>
      ))}
      <div className="form-actions">
        <button className="btn btn-secondary" disabled={pending} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={pending} onClick={() => void confirm()}>
          {pending ? 'Saving…' : archived ? 'Restore' : 'Archive'}
        </button>
      </div>
    </Modal>
  )
}
