import { Crown, Leaf, Sparkles } from 'lucide-react'

export const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'The essentials for your everyday tindahan.',
    icon: Leaf,
    features: [
      'Up to 100 active products',
      'One store · owner access',
      'POS, stock & customer utang',
      'Basic sales reports',
      'Community support',
    ],
    footnote: 'A useful place to start.',
    featured: false,
  },
  {
    name: 'Basic',
    price: 14900,
    description: 'A little more room for a growing store.',
    icon: Sparkles,
    features: [
      'Expanded product capacity*',
      'One store · up to 2 staff planned',
      'Everything in Free',
      'Advanced reports planned',
      'An ad-free experience',
    ],
    footnote: 'For your next chapter.',
    featured: true,
  },
  {
    name: 'Pro',
    price: 29900,
    description: 'Bring your growing neighborhood business together.',
    icon: Crown,
    features: [
      'Expanded product capacity*',
      'Up to 3 stores planned',
      'Expanded staff access · cap TBD',
      'Branch reports planned',
      'An ad-free experience',
    ],
    footnote: 'More possibilities ahead.',
    featured: false,
  },
]

export type Plan = (typeof plans)[number]
