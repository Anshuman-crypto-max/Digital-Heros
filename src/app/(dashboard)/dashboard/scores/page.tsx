import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScoreList } from '@/components/scores/ScoreList'
import { ScoreForm } from '@/components/scores/ScoreForm'
import { Trophy } from 'lucide-react'

export default async function ScoresPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch scores (max 5)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scores, error } = await (supabase.from('scores') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching scores:', error)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-rose-500" />
          Golf Scores
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your latest 5 golf scores. Submitting a new score when you already have 5 will automatically remove your oldest score.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <ScoreList scores={scores || []} />
        </div>
        
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Score</h2>
            <ScoreForm />
          </div>
        </div>
      </div>
    </div>
  )
}
