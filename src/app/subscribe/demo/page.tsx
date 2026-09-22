import { completeDemoPayment } from './actions'
import { AlertCircle } from 'lucide-react'

type PageProps = {
  searchParams: Promise<{
    priceId?: string
  }>
}

export default async function DemoPaymentPage({
  searchParams,
}: PageProps) {
  const { priceId = '' } = await searchParams
  const isYearly = priceId.includes('yearly')
  const planName = isYearly ? 'Yearly Plan' : 'Monthly Plan'
  const amount = isYearly ? '£100.00' : '£10.00'

  return (
    <div className="container mx-auto max-w-lg px-4 py-24">
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
        <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">
            <strong>Demo/Test Payment Mode Active</strong>
            <br />
            No real charges will be made.
          </p>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-2">Complete Test Payment</h1>
        <p className="text-slate-400 mb-8">
          You are about to activate a test subscription.
        </p>

        <div className="bg-slate-900 rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">Plan</span>
            <span className="font-semibold text-slate-200">{planName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Amount</span>
            <span className="font-bold text-lg text-white">{amount}</span>
          </div>
        </div>

        <form action={completeDemoPayment}>
          <input type="hidden" name="priceId" value={priceId} />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Complete Test Payment
          </button>
        </form>
      </div>
    </div>
  )
}
