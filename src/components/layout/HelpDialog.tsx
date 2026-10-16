import { ChevronRight, Package, ShoppingBasket, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../ui'

const steps = [
  {
    path: '/products',
    title: '1. Meet your products',
    text: 'Add products, prices, and opening stock to your store.',
    icon: Package,
  },
  {
    path: '/pos',
    title: '2. Record a sale',
    text: 'Add products, choose Cash or Utang, then review and confirm the sale.',
    icon: ShoppingBasket,
  },
  {
    path: '/customers',
    title: '3. Get to know your suki',
    text: 'Explore customer balances and the utang ledger.',
    icon: Users,
  },
]

export default function HelpDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal title="A little help getting started" onClose={onClose}>
      <p className="mb-5 text-sm leading-relaxed text-stone-500">
        These screens use your saved store records. Confirming a sale updates stock and records cash
        or customer utang. Start with these three steps.
      </p>
      {steps.map((item) => (
        <button
          key={item.path}
          onClick={() => {
            onClose()
            navigate(item.path)
          }}
          className="mb-2 flex w-full items-center gap-3 rounded-xl border border-stone-200 p-4 text-left hover:bg-paper"
        >
          <item.icon size={21} className="text-forest" />
          <span className="flex-1">
            <strong className="block text-xs">{item.title}</strong>
            <span className="mt-1 block text-[11px] text-stone-500">{item.text}</span>
          </span>
          <ChevronRight size={16} />
        </button>
      ))}
    </Modal>
  )
}
