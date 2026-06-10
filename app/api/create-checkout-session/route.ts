import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const PRICES: Record<string, number> = {
  optimization: 799,
  builder:      1199,
  linkedin:     699,
};

const SERVICE_NAMES: Record<string, string> = {
  optimization: 'CV Optimization',
  builder:      'CV Builder + Optimization',
  linkedin:     'LinkedIn Optimization',
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-05-27.dahlia' as any,
    });

    const body            = await req.json();
    const service: string = body.service ?? 'optimization';
    const amount          = PRICES[service]        ?? 799;
    const name            = SERVICE_NAMES[service] ?? 'ResuVanta Service';
    const origin          = req.headers.get('origin') ?? 'https://resuvanta.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency:     'usd',
            product_data: { name },
            unit_amount:  amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?payment=success&service=${service}`,
      cancel_url:  `${origin}/?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
