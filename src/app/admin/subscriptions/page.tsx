import { createClient } from '@/lib/supabase/server'

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()

  const { data: rawSubscriptions } = await supabase
    .from('subscriptions')
    .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  const subscriptions = rawSubscriptions as any[] || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Subscription Management</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Subscriber</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Start Date</th>
                <th className="px-6 py-4 font-medium">Period End</th>
                <th className="px-6 py-4 font-medium">Stripe IDs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((sub) => {
                const isActive = sub.status === 'active' || sub.status === 'trialing'
                const isCanceled = !!sub.canceled_at
                const isLapsed = sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'past_due'

                let planName = sub.plan_type
                let amount = '£0.00'

                const pt = (sub.plan_type || '').toLowerCase()
                if (pt.includes('year') || pt.includes('annual')) {
                  planName = 'Yearly'
                  amount = '£100.00/yr'
                } else if (pt.includes('month')) {
                  planName = 'Monthly'
                  amount = '£10.00/mo'
                }

                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{sub.profiles?.full_name || 'No Name'}</div>
                      <div className="text-slate-500 text-xs">{sub.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {planName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {amount}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          isActive && !isCanceled ? 'bg-emerald-100 text-emerald-700' : 
                          isCanceled && isActive ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {sub.status}
                        </span>
                        {isCanceled && isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">
                            Cancels at period end
                          </span>
                        )}
                        {isLapsed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">
                            Lapsed/Canceled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      <div className="mb-1" title="Customer ID">Cus: {sub.stripe_customer_id ? sub.stripe_customer_id.substring(0, 12) + '...' : 'N/A'}</div>
                      <div title="Subscription ID">Sub: {sub.stripe_subscription_id ? sub.stripe_subscription_id.substring(0, 12) + '...' : 'N/A'}</div>
                    </td>
                  </tr>
                )
              })}

              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
