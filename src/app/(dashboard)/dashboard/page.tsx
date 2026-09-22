import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CharityManager } from '@/components/dashboard/CharityManager'
import { Charity } from '@/components/charities/CharityCard'
import { MyDrawEntries } from '@/components/dashboard/MyDrawEntries'
import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .single()

  // Get active charities for the manager
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: charities } = await (supabase.from('charities') as any)
    .select('*')
    .eq('is_active', true)
    .order('name')

  const typedCharities = (charities || []) as Charity[]

  // Get score count
  let scoreCount = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase.from('scores') as any)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  scoreCount = count || 0

  // Get subscription
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptions } = await (supabase.from('subscriptions') as any)
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
  
  const subscription = subscriptions?.[0] || null
  const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col justify-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome Back!</h2>
        <p className="text-gray-500">
          You are logged in as {profile?.full_name || user.email}. Manage your account, track your scores, and see your impact.
        </p>
      </div>

      <CharityManager 
        currentSelectedCharityId={profile?.selected_charity_id || null}
        currentPercentage={profile?.charity_contribution_percentage || null}
        availableCharities={typedCharities}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scores Summary Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-rose-500" />
              Golf Scores
            </h2>
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
              {scoreCount} / 5
            </span>
          </div>
          <p className="text-gray-500 flex-grow mb-6">
            Keep your latest scores up to date for the upcoming draws.
          </p>
          <div className="flex items-center gap-3 mt-auto">
            <Link href="/dashboard/scores" className="w-full">
              <Button className="bg-rose-500 hover:bg-rose-600 text-white w-full">
                Manage Scores
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Subscription Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription</h2>
            {isSubscribed ? (
               <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                 Active
               </span>
            ) : (
               <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                 Inactive
               </span>
            )}
          </div>
          
          {isSubscribed ? (
            <>
              <p className="text-gray-500 mb-4 text-sm">
                Your subscription is active. You are currently entered into the monthly draw.
              </p>
              {subscription.current_period_end && (
                <p className="text-xs text-gray-400 mb-6 flex-grow">
                  Renews on: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
              <form action="/api/stripe/portal" method="POST" className="mt-auto w-full">
                <Button type="submit" variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              </form>
            </>
          ) : (
             <>
              <p className="text-gray-500 flex-grow mb-6 text-sm">
                You are not currently subscribed. Subscribe to support charities and enter the draw.
              </p>
              <Link href="/subscribe" className="w-full mt-auto">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Subscribe Now
                </Button>
              </Link>
             </>
          )}
        </div>
        
        {/* Draw Entries Card */}
        <div className="md:col-span-2">
          <MyDrawEntries userId={user.id} />
        </div>
      </div>
    </div>
  )
}
