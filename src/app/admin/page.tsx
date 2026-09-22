import { createClient } from '@/lib/supabase/server'
import { Users, CreditCard, Ticket, Trophy, Banknote, Heart, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  // 1. Total users
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // 2. Active subs (fetch all to count monthly/yearly and calculate MRR)
  const { data: activeSubscriptionsRaw } = await supabase
    .from('subscriptions')
    .select('plan_type')
    .in('status', ['active', 'trialing'])

  const activeSubscriptions = (activeSubscriptionsRaw as any[]) || []
  let monthlyCount = 0
  let yearlyCount = 0
  let mrr = 0

  activeSubscriptions.forEach((sub) => {
    const p = (sub.plan_type || '').toLowerCase()
    if (p.includes('year')) {
      yearlyCount++
      mrr += 100 / 12 // ~8.33 per month
    } else {
      monthlyCount++
      mrr += 10 // £10 per month
    }
  })

  // 3. Current draws (published vs total)
  const { count: publishedDraws } = await supabase
    .from('draws')
    .select('*', { count: 'exact', head: true })
    .in('status', ['published', 'completed'])

  // 4. Pending Claims
  const { count: pendingClaims } = await supabase
    .from('winner_claims')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending')

  // 5. Total Charity Contributions
  const { data: rawDonations } = await supabase
    .from('donations')
    .select('amount')
  
  const donations = rawDonations as any[]
  const totalDonations = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0

  // 6. Current Prize Pool (from draft/simulated draw)
  const { data: currentPoolDataRaw } = await supabase
    .from('draws')
    .select(`
      id,
      draw_month,
      status,
      prize_pools (
        total_pool,
        jackpot_amount
      )
    `)
    .in('status', ['draft', 'simulated'])
    .order('draw_month', { ascending: true })
    .limit(1)
    .single()

  const currentPoolData = currentPoolDataRaw as any
  const currentPool = currentPoolData?.prize_pools?.[0]

  // 7. Recent users
  const { data: recentUsersRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
    
  const recentUsers = (recentUsersRaw as any[]) || []

  const metrics = [
    {
      title: 'Total Users',
      value: usersCount || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Active Subscribers',
      value: activeSubscriptions.length,
      icon: CreditCard,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      subtext: `${monthlyCount} Monthly / ${yearlyCount} Yearly`
    },
    {
      title: 'Estimated MRR',
      value: `£${mrr.toFixed(2)}`,
      icon: Activity,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      title: 'Total Charity Impact',
      value: `£${totalDonations.toFixed(2)}`,
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
    {
      title: 'Current Prize Pool',
      value: `£${Number(currentPool?.total_pool || 0).toFixed(2)}`,
      icon: Banknote,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      subtext: `Jackpot: £${Number(currentPool?.jackpot_amount || 0).toFixed(2)}`
    },
    {
      title: 'Pending Claims',
      value: pendingClaims || 0,
      icon: Trophy,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-2">Welcome to the Digital Heroes Admin Panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${m.bgColor}`}>
              <m.icon className={`w-6 h-6 ${m.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{m.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{m.value}</h3>
              {m.subtext && <p className="text-xs text-slate-400 mt-1">{m.subtext}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Signups</h3>
            <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentUsers?.map((user) => (
              <div key={user.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{user.full_name || 'No Name'}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {!recentUsers?.length && (
              <div className="px-6 py-8 text-center text-slate-500">No recent users.</div>
            )}
          </div>
        </div>

        {/* Current Draw Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Next Draw Status</h3>
            <Link href="/admin/draws" className="text-sm text-blue-600 hover:underline">Manage Draws</Link>
          </div>
          <div className="p-6 text-center space-y-4">
            {currentPoolData ? (
              <>
                <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Ticket className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {new Date(currentPoolData.draw_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Draw
                  </h4>
                  <p className="text-slate-500 capitalize mt-1">Status: {currentPoolData.status}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500">Total Pool</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      £{Number(currentPool?.total_pool || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500">Jackpot</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      £{Number(currentPool?.jackpot_amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-slate-500">
                <Ticket className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p>No upcoming drafts or simulated draws.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
