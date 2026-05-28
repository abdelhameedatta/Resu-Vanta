import { NextResponse } from 'next/server';

interface AIRequestBody {
  prompt: string;
  service: string;
}

interface AnthropicMessage {
  role: string;
  content: string;
}

interface AnthropicResponse {
  content: Array<{ text: string }>;
  error?: { message: string };
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: AIRequestBody = await req.json();
    const apiKey: string = process.env.ANTHROPIC_API_KEY as string;

    const response: Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Perform ${body.service} for the following data: ${body.prompt}`,
          } as AnthropicMessage,
        ],
      }),
    });

    const data: AnthropicResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch AI response');
    }

    return NextResponse.json({ result: data.content[0].text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
