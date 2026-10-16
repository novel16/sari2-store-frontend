import { Modal } from '../../components/ui'

export default function ClearOrderDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal title="Discard this order?" onClose={onCancel}>
      <p className="text-sm leading-relaxed text-stone-600">
        The items, discount, payment details, and saved draft will be cleared. No sale will be
        recorded.
      </p>
      <div className="form-actions">
        <button className="btn btn-secondary" data-autofocus onClick={onCancel}>
          Keep order
        </button>
        <button className="btn btn-primary" onClick={onConfirm}>
          Discard & start new order
        </button>
      </div>
    </Modal>
  )
}
