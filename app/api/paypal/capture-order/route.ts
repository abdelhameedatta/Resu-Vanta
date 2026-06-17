import { NextResponse } from 'next/server';

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
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const accessToken = await getAccessToken();
    const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed to capture order' }, { status: 500 });

    const status = data.status;
    if (status === 'COMPLETED') {
      return NextResponse.json({ success: true, orderId: data.id });
    }

    return NextResponse.json({ error: `Unexpected status: ${status}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
