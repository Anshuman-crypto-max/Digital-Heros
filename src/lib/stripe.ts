import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Stripe: Missing STRIPE_SECRET_KEY in environment variables.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-08-26.dahlia' as any, // Type override for strict SDK versioning
  appInfo: {
    name: 'Digital Heroes',
    version: '0.1.0',
  },
})
