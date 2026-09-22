import 'server-only'
import Stripe from 'stripe'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY

  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is required when Stripe payment mode is enabled.'
    )
  }

  return new Stripe(key, {
    apiVersion: '2026-08-26.dahlia' as any,
    appInfo: {
      name: 'Digital Heroes',
    },
  })
}
