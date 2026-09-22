import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Trophy, Coins } from 'lucide-react'

export default async function DrawsPage() {
  const supabase = await createClient()

  const { data: draws, error } = await supabase
    .from('draws')
    .select(`
      id,
      draw_month,
      draw_date,
      generated_numbers,
      status,
      prize_pools (
        total_pool,
        jackpot_amount
      )
    `)
    .in('status', ['published', 'completed'])
    .order('draw_month', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight sm:text-5xl">
          Draw Results
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          See the winning numbers from our past monthly draws. Remember, your subscription doesn&apos;t just give you a chance to win—it makes a difference.
        </p>
      </div>

      {error ? (
        <div className="text-center text-red-500 py-12">Failed to load draws.</div>
      ) : !draws || draws.length === 0 ? (
        <div className="text-center py-24 bg-slate-800/50 rounded-2xl border border-slate-700">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300">No draws yet</h3>
          <p className="mt-2 text-slate-500">Check back later for our first monthly draw results!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {draws.map((draw: any) => {
            const date = new Date(draw.draw_date).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })
            
            const prizePool = draw.prize_pools?.[0]
            const totalPool = prizePool ? Number(prizePool.total_pool).toFixed(2) : '0.00'
            const jackpot = prizePool ? Number(prizePool.jackpot_amount).toFixed(2) : '0.00'

            return (
              <Link 
                key={draw.id} 
                href={`/draws/${draw.id}`}
                className="block group"
              >
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 md:p-8 hover:bg-slate-750 hover:border-emerald-500/50 transition-all duration-300 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center text-emerald-400 mb-2">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span className="font-semibold">{date} Draw</span>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        {draw.generated_numbers?.map((num: number, idx: number) => (
                          <div 
                            key={idx}
                            className="w-12 h-12 rounded-full bg-slate-900 border-2 border-emerald-500/30 flex items-center justify-center text-lg font-bold text-slate-100 group-hover:border-emerald-500 transition-colors shadow-inner"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 md:text-right">
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center md:justify-end text-slate-400 text-sm mb-1">
                          <Coins className="w-4 h-4 mr-1" /> Total Prize Pool
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">
                          ${totalPool}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">
                        Jackpot: <span className="text-slate-300 font-medium">${jackpot}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
