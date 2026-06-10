import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const PRICES: Record<string, number> = {
  optimization: 799,
  builder: 1199,
  linkedin: 699,
};

const SERVICE_NAMES: Record<string, string> = {
  optimization: 'CV Optimization',
  builder: 'CV Builder + Optimization',
  linkedin: 'LinkedIn Optimization',
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // 1. التأكد من وجود المفتاح السري لمنع انهيار السيرفر
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is missing in Vercel env variables' }, { status: 500 });
    }

    // 2. إصلاح طريقة استدعاء سترايب (حذفنا الـ apiVersion المضروب عشان ياخد الافتراضي النضيف لحسابك)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = await req.json();
    const service: string = body.service ?? 'optimization';
    const amount = PRICES[service] ?? 799;
    const name = SERVICE_NAMES[service] ?? 'ResuVanta Service';

    let origin = 'https://resuvanta.com';
    try {
      const url = new URL(req.url);
      origin = `${url.protocol}//${url.host}`;
    } catch {}

    // 3. إنشاء جلسة الدفع الخارجية
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?payment=success&service=${service}`,
      cancel_url:  `${origin}/cancel?payment=cancelled&service=${service}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
