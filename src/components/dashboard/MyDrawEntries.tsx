import { createClient } from '@/lib/supabase/server'
import { Ticket, Coins } from 'lucide-react'
import Link from 'next/link'
import { ClaimPrize } from '@/components/dashboard/ClaimPrize'

export async function MyDrawEntries({ userId }: { userId: string }) {
  const supabase = await createClient()

  // Fetch the latest entry for the user
  const { data: rawEntries, error } = await supabase
    .from('draw_entries')
    .select(`
      numbers,
      draw_id,
      draws (
        draw_month,
        status,
        generated_numbers
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3)
    
  const entries = rawEntries as any[]

  if (error || !entries || entries.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
        <Ticket className="w-12 h-12 text-slate-200 mb-3" />
        <h3 className="text-lg font-medium text-slate-800">No entries yet</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-[250px]">
          Subscribe and submit your golf scores to be automatically entered into the next draw.
        </p>
      </div>
    )
  }

  // Get potential winnings for these entries
  const drawIds = entries.map(e => e.draw_id)
  const { data: rawResults } = await supabase
    .from('draw_results')
    .select('draw_id, match_count, prize_amount, prize_tier')
    .eq('user_id', userId)
    .in('draw_id', drawIds)
    
  const results = rawResults as any[]

  const { data: rawClaims } = await supabase
    .from('winner_claims')
    .select('*')
    .eq('user_id', userId)
    
  const claims = rawClaims as any[] || []

  return (
    <div className="rounded-2xl bg-slate-900 p-6 shadow-xl border border-slate-800 flex flex-col text-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Ticket className="h-5 w-5 text-emerald-400" />
          My Draw Entries
        </h2>
        <Link href="/draws" className="text-sm text-emerald-400 hover:text-emerald-300">
          View all results
        </Link>
      </div>

      <div className="space-y-4 flex-grow">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {entries.map((entry: any, i: number) => {
          const draw = entry.draws
          const date = new Date(draw.draw_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          const isPublished = draw.status === 'published' || draw.status === 'completed'
          
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = results?.find((r: any) => r.draw_id === entry.draw_id)
          const claim = claims.find((c: any) => c.draw_result_id === result?.id)
          
          return (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-slate-300">{date} Draw</span>
                {isPublished ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                    Results out
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-400 text-xs font-medium">
                    Pending
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 justify-center mb-4">
                {entry.numbers.map((num: number, idx: number) => {
                  const isMatch = isPublished && draw.generated_numbers?.includes(num)
                  return (
                    <div 
                      key={idx}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                        isMatch 
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                          : 'bg-slate-800 border-slate-600 text-slate-300'
                      }`}
                    >
                      {num}
                    </div>
                  )
                })}
              </div>

              {isPublished && result && (
                <div className="mt-3 pt-3 border-t border-slate-700 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-slate-400">
                      {result.match_count} Matches
                    </div>
                    <div className="flex items-center text-emerald-400 font-bold text-lg">
                      <Coins className="w-4 h-4 mr-1" />
                      ${Number(result.prize_amount).toFixed(2)}
                    </div>
                  </div>
                  
                  {Number(result.prize_amount) > 0 && (
                    <div className="flex justify-end border-t border-slate-700/50 pt-2">
                      <ClaimPrize drawResultId={result.id} userId={userId} existingClaim={claim} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
