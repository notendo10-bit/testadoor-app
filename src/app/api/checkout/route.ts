import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: 'テスタドア ルーム作成権',
            description: 'Google Playテスター12人をあなたのアプリに届けます',
          },
          unit_amount: 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${BASE_URL}/create?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/create`,
    locale: 'ja',
  })

  return NextResponse.json({ url: session.url })
}
