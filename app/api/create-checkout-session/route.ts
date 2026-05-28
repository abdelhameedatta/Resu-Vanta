import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

interface PaymentRequestBody {
  serviceId: string;
}

const prices: Record<string, number> = {
  'cv-optimization': 799,
  'cv-builder': 1199,
  'linkedin-optimization': 699,
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: PaymentRequestBody = await req.json();
    const amount: number = prices[body.serviceId] || 799;

    const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
