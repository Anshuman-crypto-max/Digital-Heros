import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Database } from 'lucide-react'

export default async function AdminDrawDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rawDraw, error: drawError } = await supabase
    .from('draws')
    .select(`
      *,
      prize_pools (
        total_pool,
        jackpot_amount,
        four_match_amount,
        three_match_amount
      )
    `)
    .eq('id', id)
    .single()

  const draw = rawDraw as any

  if (drawError || !draw) {
    notFound()
  }

  const { count: entriesCount } = await supabase
    .from('draw_entries')
    .select('*', { count: 'exact', head: true })
    .eq('draw_id', id)

  const isSimulated = draw.status === 'simulated' && draw.simulation_result
  const pool = draw.prize_pools?.[0]
  
  // If simulated, use the simulation result for data, else query the real tables
  let stats: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 }
  let totalPool = 0
  let jackpot = 0
  let fourMatch = 0
  let threeMatch = 0

  if (isSimulated) {
    const sim = draw.simulation_result
    totalPool = sim.prizePool.totalPool
    jackpot = sim.prizePool.jackpotAmount
    fourMatch = sim.prizePool.fourMatchAmount
    threeMatch = sim.prizePool.threeMatchAmount
    
    sim.entries.forEach((e: any) => {
      stats[e.matchCount] = (stats[e.matchCount] || 0) + 1
    })
  } else if (draw.status === 'published' || draw.status === 'completed') {
    totalPool = Number(pool?.total_pool || 0)
    jackpot = Number(pool?.jackpot_amount || 0)
    fourMatch = Number(pool?.four_match_amount || 0)
    threeMatch = Number(pool?.three_match_amount || 0)
    
    const { data: results } = await supabase
      .from('draw_results')
      .select('match_count')
      .eq('draw_id', id)

    if (results) {
      results.forEach((r: any) => {
        stats[r.match_count] = (stats[r.match_count] || 0) + 1
      })
    }
  }

  const date = new Date(draw.draw_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/admin/draws" className="inline-flex items-center text-slate-500 hover:text-slate-800 text-sm font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Draws
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{date} Draw</h1>
          <p className="text-slate-500 mt-1">ID: {draw.id}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
          draw.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 
          draw.status === 'simulated' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
        }`}>
          {draw.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
            Generated Numbers
          </h2>
          <div className="flex flex-wrap gap-3">
            {draw.generated_numbers ? draw.generated_numbers.map((n: number, i: number) => (
              <div key={i} className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
                {n}
              </div>
            )) : (
              <p className="text-slate-500 italic">Not generated yet.</p>
            )}
          </div>
          
          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-500" />
              Draw Statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Entries</p>
                <p className="text-2xl font-bold text-slate-900">{entriesCount || (isSimulated ? draw.simulation_result.entries.length : 0)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider mb-1">Match 5</p>
                <p className="text-2xl font-bold text-emerald-900">{stats[5]}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider mb-1">Match 4</p>
                <p className="text-2xl font-bold text-emerald-900">{stats[4]}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider mb-1">Match 3</p>
                <p className="text-2xl font-bold text-emerald-900">{stats[3]}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Prize Pool Calculation</h2>
          
          {draw.status !== 'draft' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div>
                  <p className="text-sm text-slate-500">Total Pool</p>
                </div>
                <p className="text-xl font-bold text-slate-900">${totalPool.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div>
                  <p className="text-sm text-slate-500">Match 5 (Jackpot) <span className="text-xs text-emerald-600 bg-emerald-100 px-1 rounded ml-1">60%</span></p>
                </div>
                <p className="text-lg font-semibold text-slate-800">${jackpot.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div>
                  <p className="text-sm text-slate-500">Match 4 <span className="text-xs text-emerald-600 bg-emerald-100 px-1 rounded ml-1">25%</span></p>
                </div>
                <p className="text-lg font-semibold text-slate-800">${fourMatch.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div>
                  <p className="text-sm text-slate-500">Match 3 <span className="text-xs text-emerald-600 bg-emerald-100 px-1 rounded ml-1">15%</span></p>
                </div>
                <p className="text-lg font-semibold text-slate-800">${threeMatch.toFixed(2)}</p>
              </div>
              
              <div className="pt-4 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                Note: Unclaimed tiers will roll over to the jackpot in the next month's draw.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
              Prize pools are calculated during simulation.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
