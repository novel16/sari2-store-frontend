import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/ui'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper p-6 text-center">
      <Brand />
      <p className="eyebrow mt-6">A LITTLE DETOUR</p>
      <h1 className="font-display text-3xl font-bold">This shelf is empty.</h1>
      <p className="text-sm text-stone-500">The page you’re looking for isn’t here.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Back to your store <ArrowRight size={16} />
      </Link>
    </main>
  )
}
