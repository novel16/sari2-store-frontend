import { ChevronDown } from 'lucide-react'
const questions = [
  [
    'How do I activate or renew Basic?',
    'Contact your service administrator for manual payment verification. They review and confirm the plan, price, duration, and reference before saving your period. Complimentary grants require a reason. Plus and Pro remain coming soon.',
  ],
  [
    'Will I be charged automatically?',
    'No. Renewal is manual. A confirmed renewal starts after the last saved paid period. The next scheduled period appears above. Each new period uses the price and allowances reviewed at confirmation.',
  ],
  [
    'What happens when a paid period ends?',
    'The Free allowance applies when no paid period remains active. Your existing products, sales history, inventory, and customer utang are preserved. Adding or restoring products is restricted when you reach the allowance.',
  ],
  [
    'Are sales and customer payments limited?',
    'There is no monthly sales cap. You can continue recording cash and utang sales and collecting existing customer balances.',
  ],
  [
    'Does the product allowance count stock quantity?',
    'No. It counts active product entries. A product with 100 pieces in stock uses one product slot. An account-wide allowance counts entries across all its stores, including separate entries for the same item in different branches.',
  ],
]
export default function SubscriptionQuestions() {
  return (
    <section className="mx-auto mt-8 max-w-3xl">
      <h2 className="mb-4 text-center font-display text-xl font-semibold">
        A few things you might be wondering
      </h2>
      {questions.map(([question, answer]) => (
        <details className="group border-b border-stone-200/80 py-4" key={question}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
            {question}
            <ChevronDown
              size={16}
              className="shrink-0 text-stone-400 transition group-open:rotate-180"
            />
          </summary>
          <p className="mt-3 pr-7 text-sm leading-relaxed text-stone-500">{answer}</p>
        </details>
      ))}
    </section>
  )
}
