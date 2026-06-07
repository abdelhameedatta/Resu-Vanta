// @ts-nocheck
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51Tai3cGfyR1SSFQSNmEkyPNkXlDwM5TvWPqBUkJioUShpxp8uEm6Xs4gqPz7KJbovILyzINEmra18mMARFwX4thr00xVz98eKn', {
  apiVersion: '2024-06-20',
});

const prices: Record<string, number> = {
  optimization: 799,
  builder: 1199,
  linkedin: 699,
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const service = body.service || 'optimization';
    const amount = prices[service] || 799;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
