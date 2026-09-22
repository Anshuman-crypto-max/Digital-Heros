import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Trophy } from 'lucide-react'

export default async function DrawDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the draw, prize pool, and aggregate the results
  const { data: drawData, error: drawError } = await supabase
    .from('draws')
    .select(`
      id,
      draw_month,
      draw_date,
      generated_numbers,
      status,
      prize_pools (
        total_pool,
        jackpot_amount,
        four_match_amount,
        three_match_amount
      )
    `)
    .eq('id', id)
    .single()
  
  const draw = drawData as any

  if (drawError || !draw || (draw.status !== 'published' && draw.status !== 'completed')) {
    notFound()
  }

  // Fetch winners count per tier
  const { data: results } = await supabase
    .from('draw_results')
    .select('match_count, prize_amount')
    .eq('draw_id', id)

  const prizePool = draw.prize_pools?.[0]
  const date = new Date(draw.draw_date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  // Aggregate stats
  const stats = {
    5: { count: 0, prizeEach: 0, total: Number(prizePool?.jackpot_amount || 0) },
    4: { count: 0, prizeEach: 0, total: Number(prizePool?.four_match_amount || 0) },
    3: { count: 0, prizeEach: 0, total: Number(prizePool?.three_match_amount || 0) },
  }

  if (results) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results.forEach((r: any) => {
      if (r.match_count === 5) {
        stats[5].count++
        stats[5].prizeEach = Number(r.prize_amount)
      } else if (r.match_count === 4) {
        stats[4].count++
        stats[4].prizeEach = Number(r.prize_amount)
      } else if (r.match_count === 3) {
        stats[3].count++
        stats[3].prizeEach = Number(r.prize_amount)
      }
    })
  }

  const renderTier = (match: number, data: { count: number, prizeEach: number, total: number }) => (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-200">{match} Numbers Matched</h3>
        <span className="px-3 py-1 bg-slate-900 rounded-full text-emerald-400 text-sm font-medium border border-slate-700">
          {data.count} Winner{data.count !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-500 mb-1">Total Tier Prize</div>
          <div className="text-2xl font-semibold text-slate-200">${data.total.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500 mb-1">Prize per Winner</div>
          <div className="text-2xl font-semibold text-emerald-400">
            {data.count > 0 ? `$${data.prizeEach.toFixed(2)}` : 'Rolled over'}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/draws" className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to all draws
      </Link>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl mb-8">
        <div className="p-8 md:p-12 text-center border-b border-slate-700 bg-slate-900/50">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-100 mb-4">{date} Draw</h1>
          <p className="text-slate-400 text-lg">
            Total Prize Pool: <span className="text-emerald-400 font-bold">${Number(prizePool?.total_pool || 0).toFixed(2)}</span>
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {draw.generated_numbers?.map((num: number, idx: number) => (
              <div 
                key={idx}
                className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-2xl font-bold text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-6">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center">
            <Trophy className="w-6 h-6 mr-3 text-emerald-400" /> 
            Prize Breakdown
          </h2>
          {renderTier(5, stats[5])}
          {renderTier(4, stats[4])}
          {renderTier(3, stats[3])}
        </div>
      </div>
    </div>
  )
}
