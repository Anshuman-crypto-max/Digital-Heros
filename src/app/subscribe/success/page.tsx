import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function SubscribeSuccessPage() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-24 text-center">
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-4">Subscription Successful!</h1>
        <p className="text-slate-400 mb-8">
          Thank you for subscribing to Digital Heroes. Your contribution will help your chosen charity, and you&apos;re now entered into the next draw!
        </p>
        <Link 
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
