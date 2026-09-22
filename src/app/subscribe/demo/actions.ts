'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'

export async function completeDemoPayment(formData: FormData) {
  const priceId = formData.get('priceId') as string
  const planType = priceId.includes('yearly') ? 'yearly' : 'monthly'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Ensure Service Role Key is present and valid
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey || serviceRoleKey === '...' || serviceRoleKey.length < 20) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Admin privileges are required to bypass RLS and create a test subscription.')
  }

  // Create an admin client to bypass RLS for inserting/updating subscriptions
  const adminSupabase = createAdminClient()

  // Create start and end dates
  const now = new Date()
  const endDate = new Date()
  if (planType === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1)
  } else {
    endDate.setMonth(endDate.getMonth() + 1)
  }

  // Check if subscription already exists. Use the standard client because users can read their own subscriptions via RLS.
  const { data: existingSub, error: selectError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (selectError) {
    console.error('Failed to fetch existing subscription:', selectError)
    throw new Error(`Failed to verify existing subscription: ${selectError.message}`)
  }

  const mockCustomerId = `demo_cust_${user.id.substring(0, 8)}`
  const mockSubscriptionId = `demo_sub_${randomBytes(8).toString('hex')}`

  if (existingSub && existingSub.length > 0) {
    // Update existing
    const { error: updateError } = await (adminSupabase.from('subscriptions') as any)
      .update({
        plan_type: planType,
        status: 'active',
        stripe_customer_id: mockCustomerId,
        stripe_subscription_id: mockSubscriptionId,
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        canceled_at: null,
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update demo subscription. Full error object:', JSON.stringify(updateError, null, 2))
      throw new Error(`Failed to activate test subscription: ${updateError.message} (Code: ${updateError.code})`)
    }
  } else {
    // Insert new
    const { error: insertError } = await (adminSupabase.from('subscriptions') as any)
      .insert({
        user_id: user.id,
        plan_type: planType,
        status: 'active',
        stripe_customer_id: mockCustomerId,
        stripe_subscription_id: mockSubscriptionId,
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
      })

    if (insertError) {
      console.error('Failed to insert demo subscription. Full error object:', JSON.stringify(insertError, null, 2))
      throw new Error(`Failed to create test subscription: ${insertError.message} (Code: ${insertError.code})`)
    }
  }

  redirect('/subscribe/success')
}
