import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing stripe signature or secret' }, { status: 400 })
    }
    
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook Error: ${message}`)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // This is the Supabase User ID we attached when creating the session
        const userId = session.client_reference_id || session.metadata?.userId
        
        if (!userId) {
          throw new Error('No user ID found in session')
        }

        // We'll actually do the heavy lifting in customer.subscription.created or updated,
        // but we might want to link the customer ID to the user if we haven't already.
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Let's get the customer to find the user_id if we don't have it in metadata
        // Alternatively, the best way is to fetch the user_id from our DB based on stripe_customer_id,
        // BUT for a new subscription, we might not have it mapped yet. 
        // Wait, where did we map it? 
        // We can retrieve the checkout session or customer to get the metadata.
        
        // Let's fetch the customer to check for metadata, or rely on checkout.session.completed 
        // passing it to the customer. Since we didn't pass metadata to the customer directly in checkout,
        // let's fetch the user_id by checking if a subscription already exists for this stripe_customer_id,
        // OR we can update the customer during checkout session creation.
        // Actually, Stripe creates the customer during checkout, we should retrieve the user_id from metadata of the subscription or customer.
        // Let's fix this by finding the user ID.
        // If it's a new subscription, we might need to search the customer.
        const stripe = getStripe()
        const customer = await stripe.customers.retrieve(customerId)
        let userId = (customer as Stripe.Customer).metadata?.userId || subscription.metadata?.userId;
        
        if (!userId) {
           // If we can't find it in metadata, maybe it's in our DB already
           const { data: existingSub } = await supabaseAdmin
             .from('subscriptions')
             .select('user_id')
             .eq('stripe_customer_id', customerId)
             .single()
             
           if (existingSub) {
             userId = existingSub.user_id
           }
        }

        if (!userId) {
          console.error('Could not find user ID for subscription', subscription.id)
          break;
        }

        const planType = subscription.items.data[0]?.price.id || 'unknown'
        
        const subscriptionData = {
          user_id: userId,
          plan_type: planType,
          status: subscription.status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(((subscription as any).current_period_start || 0) * 1000).toISOString(),
          current_period_end: new Date(((subscription as any).current_period_end || 0) * 1000).toISOString(),
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        }

        // Upsert into subscriptions table
        // First check if it exists by stripe_subscription_id
        const { data: existingRecord } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingRecord) {
          const { error } = await supabaseAdmin
            .from('subscriptions')
            .update(subscriptionData)
            .eq('id', existingRecord.id)
            
          if (error) throw error
        } else {
          // If it doesn't exist by subscription ID, check if the user already has a row (they might have an old one)
          const { data: userExistingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .single()
            
          if (userExistingSub) {
             const { error } = await supabaseAdmin
              .from('subscriptions')
              .update(subscriptionData)
              .eq('id', userExistingSub.id)
            if (error) throw error
          } else {
             const { error } = await supabaseAdmin
              .from('subscriptions')
              .insert(subscriptionData)
            if (error) throw error
          }
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error('Error processing webhook:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
