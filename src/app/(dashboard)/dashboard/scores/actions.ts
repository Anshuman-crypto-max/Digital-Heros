'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addScore(formData: FormData) {
  const supabase = await createClient()
  
  const scoreStr = formData.get('score') as string
  const scoreDate = formData.get('score_date') as string
  
  if (!scoreStr || !scoreDate) {
    return { error: 'Score and date are required.' }
  }

  const score = parseInt(scoreStr, 10)
  
  if (isNaN(score) || score < 1 || score > 45) {
    return { error: 'Score must be an integer between 1 and 45.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // Ensure the user's profile exists safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase.from('profiles') as any).insert({
      id: user.id,
      email: user.email,
      role: 'subscriber'
    })
    
    if (profileError) {
      return { error: 'Failed to create user profile: ' + profileError.message }
    }
  }

  // Insert the new score
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase.from('scores') as any)
    .insert({
      user_id: user.id,
      score,
      score_date: scoreDate,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'You already have a score for this date.' }
    }
    return { error: insertError.message }
  }

  // Enforce the 5-score limit
  // Fetch all scores for the user ordered by date descending, then created_at descending
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allScores, error: fetchError } = await (supabase.from('scores') as any)
    .select('id')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (!fetchError && allScores && allScores.length > 5) {
    // Keep the first 5, delete the rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idsToDelete = allScores.slice(5).map((s: any) => s.id)
    if (idsToDelete.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('scores') as any)
        .delete()
        .in('id', idsToDelete)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/scores')
  
  return { success: true }
}

export async function editScore(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const scoreStr = formData.get('score') as string
  const scoreDate = formData.get('score_date') as string
  
  if (!scoreStr || !scoreDate) {
    return { error: 'Score and date are required.' }
  }

  const score = parseInt(scoreStr, 10)
  
  if (isNaN(score) || score < 1 || score > 45) {
    return { error: 'Score must be an integer between 1 and 45.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from('scores') as any)
    .update({
      score,
      score_date: scoreDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id) // Security check

  if (updateError) {
    if (updateError.code === '23505') {
      return { error: 'You already have a score for this date.' }
    }
    return { error: updateError.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/scores')
  
  return { success: true }
}

export async function deleteScore(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('scores') as any)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Security check

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/scores')
  
  return { success: true }
}
