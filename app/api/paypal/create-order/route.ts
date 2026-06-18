import { NextResponse } from 'next/server';

const FULL_PRICES: Record<string, number> = {
  optimization: 7.99,
  builder: 11.99,
  linkedin: 6.99,
};

const DISCOUNT_EXPIRY = new Date('2026-07-19T23:59:59Z');
const DISCOUNT_RATE = 0.30;

function getFinalPrice(service: string): string {
  const full = FULL_PRICES[service];
  if (!full) return '';
  const now = new Date();
  const discounted = now < DISCOUNT_EXPIRY
    ? Math.round(full * (1 - DISCOUNT_RATE) * 100) / 100
    : full;
  return discounted.toFixed(2);
}

async function getAccessToken(): Promise<string> {
  const clientId = 'AQ1H5egYCxlvThzNNyEPpP69tjgTlcG0t5_f3pl3q8FD1TBSpvIWHJF6UBuePkgAGAKcD692Lep80I_Z';
  const secret = process.env.PAYPAL_SECRET!;
  const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to get PayPal access token');
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { service } = await req.json();
    const amount = getFinalPrice(service);
    if (!amount) return NextResponse.json({ error: 'Invalid service' }, { status: 400 });

    const accessToken = await getAccessToken();
    const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: amount },
            description: `ResuVanta - ${service}`,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed to create order' }, { status: 500 });

    return NextResponse.json({ orderId: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
