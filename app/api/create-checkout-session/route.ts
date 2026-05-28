// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const SERVICE_CONFIG: Record<string, { name: string; price: number }> = {
  optimization: { name: 'ResuVanta CV Optimization', price: 799 },
  builder: { name: 'ResuVanta CV Builder + Optimization', price: 1199 },
  linkedin: { name: 'ResuVanta LinkedIn Optimization', price: 699 },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service } = body;

    if (!service || !SERVICE_CONFIG[service]) {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }

    const config = SERVICE_CONFIG[service];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: config.price,
      currency: 'usd',
      metadata: { service },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      service,
    });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
