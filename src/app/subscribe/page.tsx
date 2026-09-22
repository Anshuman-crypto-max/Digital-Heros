'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Placeholder Price IDs - user will update these in env or constants later.
  // For now, we will just use placeholders that the API route could expect.
  // Ideally, these come from environment variables.
  const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder'
  const YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || 'price_yearly_placeholder'

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 text-slate-100">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Support Charities. Win Big.</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Join Digital Heroes to enter the monthly draw. A minimum of 10% of your subscription goes directly to your selected charity.
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Monthly Plan */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 flex flex-col hover:border-blue-500 transition-colors">
          <h2 className="text-2xl font-bold mb-2">Monthly</h2>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-extrabold">£10</span>
            <span className="text-slate-400">/month</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-slate-300">
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-500" />
              <span>1 entry per month in the draw</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-500" />
              <span>Minimum 10% to your charity</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-500" />
              <span>Track golf scores</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-500" />
              <span>Cancel anytime</span>
            </li>
          </ul>
          <button
            onClick={() => handleSubscribe(MONTHLY_PRICE_ID)}
            disabled={loading !== null}
            className="w-full py-4 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
          >
            {loading === MONTHLY_PRICE_ID ? 'Processing...' : 'Subscribe Monthly'}
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="bg-gradient-to-b from-blue-900 to-slate-900 rounded-2xl p-8 border border-blue-500 relative flex flex-col transform md:-translate-y-4 shadow-xl shadow-blue-900/20">
          <div className="absolute top-0 right-8 transform -translate-y-1/2">
            <span className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
              Best Value
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Yearly</h2>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-extrabold text-white">£100</span>
            <span className="text-blue-200">/year</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-blue-100">
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-blue-400" />
              <span>12 entries in the draw</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-blue-400" />
              <span>Minimum 10% to your charity</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-blue-400" />
              <span>Track golf scores</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-white">Save £20 per year</span>
            </li>
          </ul>
          <button
            onClick={() => handleSubscribe(YEARLY_PRICE_ID)}
            disabled={loading !== null}
            className="w-full py-4 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {loading === YEARLY_PRICE_ID ? 'Processing...' : 'Subscribe Yearly'}
          </button>
        </div>
      </div>
    </div>
  )
}
