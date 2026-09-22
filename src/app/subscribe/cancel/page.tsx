import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function SubscribeCancelPage() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-24 text-center">
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-4">Checkout Cancelled</h1>
        <p className="text-slate-400 mb-8">
          Your checkout process was cancelled. You haven&apos;t been charged. When you&apos;re ready to support charities and enter the draw, you can try again.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/dashboard"
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="/subscribe"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}
