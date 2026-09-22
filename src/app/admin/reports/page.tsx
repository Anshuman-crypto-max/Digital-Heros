import { createAdminClient } from '@/lib/supabase/admin'
import { DollarSign, Users, Ticket, Heart, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const supabase = createAdminClient()

  // For this MVP, we'll do some basic aggregations in JS since our dataset is small.
  // We use the admin client to bypass RLS and see all data across the platform.

  const [
    { data: profiles, error: errProfiles },
    { data: subs, error: errSubs },
    { data: draws, error: errDraws },
    { data: charities, error: errCharities },
    { data: prizePools, error: errPrizePools },
    { data: winnerClaims, error: errWinnerClaims },
    { data: drawResults, error: errDrawResults }
  ] = await Promise.all([
    supabase.from('profiles').select('id, role, created_at'),
    supabase.from('subscriptions').select('status, plan_type, current_period_end'),
    supabase.from('draws').select('id, status, draw_month'),
    supabase.from('charities').select('id, is_active'),
    supabase.from('prize_pools').select('total_pool'),
    supabase.from('winner_claims').select('*'),
    supabase.from('draw_results').select('id, prize_amount')
  ])

  // Error handling
  if (errProfiles) console.error("Error fetching profiles:", errProfiles)
  if (errSubs) console.error("Error fetching subscriptions:", errSubs)
  if (errDraws) console.error("Error fetching draws:", errDraws)
  if (errCharities) console.error("Error fetching charities:", errCharities)
  if (errPrizePools) console.error("Error fetching prize_pools:", errPrizePools)
  if (errWinnerClaims) console.error("Error fetching winner_claims:", errWinnerClaims)
  if (errDrawResults) console.error("Error fetching draw_results:", errDrawResults)

  const hasError = errProfiles || errSubs || errDraws || errCharities || errPrizePools || errWinnerClaims || errDrawResults

  // Basic Calculations
  const totalUsers = profiles?.length || 0
  const activeSubs = subs?.filter(s => s.status === 'active' || s.status === 'trialing') || []
  const totalSubscribers = activeSubs.length
  
  // Approximate Monthly Revenue (Monthly = £10, Yearly = £100 / 12)
  let mrr = 0
  activeSubs.forEach(sub => {
    if (sub.plan_type === 'monthly') mrr += 10
    if (sub.plan_type === 'yearly') mrr += (100 / 12)
  })

  // Total Prize Pool
  const totalPrizes = prizePools?.reduce((acc, pool) => {
    return acc + (Number(pool.total_pool) || 0)
  }, 0) || 0

  const activeCharities = charities?.filter(c => c.is_active).length || 0

  const totalDraws = draws?.length || 0
  const publishedDraws = draws?.filter(d => d.status === 'published' || d.status === 'completed').length || 0
  
  const totalClaims = winnerClaims?.length || 0
  let paidWinnings = 0
  
  // Match claims with draw results to get payout amount
  if (winnerClaims && drawResults) {
    const resultsMap = new Map(drawResults.map(dr => [dr.id, dr]))
    winnerClaims.filter(wc => wc.payout_status === 'paid').forEach(wc => {
      const result = resultsMap.get(wc.draw_result_id)
      if (result) {
        paidWinnings += Number(result.prize_amount)
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
      </div>

      {hasError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
          There was an error loading some report data. Check server logs for details.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow bg-white p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">Monthly Recurring Revenue (Est.)</h3>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">£{mrr.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Based on active subscriptions (Test Data)</p>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow bg-white p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">Total Subscribers</h3>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalSubscribers}</div>
            <p className="text-xs text-slate-500 mt-1">Active paid members</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow bg-white p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">All-Time Prize Pool</h3>
            <Ticket className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">£{totalPrizes.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Across {totalDraws} draws</p>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow bg-white p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">Charity Partners</h3>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{activeCharities}</div>
            <p className="text-xs text-slate-500 mt-1">Active charities</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Platform Overview</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-4 border-b pb-4 lg:border-b-0 lg:pb-0 border-slate-100">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <p className="text-xl font-bold text-slate-900">{totalUsers}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 border-b pb-4 lg:border-b-0 lg:pb-0 border-slate-100">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Draws (Total / Published)</p>
              <p className="text-xl font-bold text-slate-900">{totalDraws} / {publishedDraws}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Winner Claims (Total / Paid)</p>
              <p className="text-xl font-bold text-slate-900">{totalClaims} / £{paidWinnings.toFixed(2)} paid</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
