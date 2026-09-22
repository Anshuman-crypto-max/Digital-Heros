'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserCharity(charityId: string, percentage: number) {
  const supabase = await createClient()

  if (isNaN(percentage) || percentage < 10 || percentage > 100) {
    return { error: 'Contribution percentage must be between 10% and 100%.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // Verify the charity exists and is active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: charity } = await (supabase.from('charities') as any)
    .select('id')
    .eq('id', charityId)
    .eq('is_active', true)
    .single()

  if (!charity) {
    return { error: 'Invalid or inactive charity selected.' }
  }

  // Update profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({
      selected_charity_id: charityId,
      charity_contribution_percentage: percentage,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
