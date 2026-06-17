import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, base64, filename } = await req.json();

    if (!email || !base64) {
      return NextResponse.json({ error: 'Missing email or PDF data' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'ResuVanta <noreply@resuvanta.com>',
      to: email,
      subject: 'Your Optimized CV from ResuVanta',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8F6F1; padding: 40px 32px; border-radius: 12px;">
          <h2 style="color: #1C1A16; font-size: 22px; margin: 0 0 12px;">Your CV is Ready!</h2>
          <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            Thank you for using <strong>ResuVanta</strong>. Your optimized CV is attached to this email as a PDF.
          </p>
          <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Please save this email as proof that you received your CV.
          </p>
          <hr style="border: none; border-top: 1px solid #E5E0D6; margin: 0 0 24px;" />
          <p style="color: #888; font-size: 12px; margin: 0;">
            If you have any issues, contact us at <a href="mailto:support@resuvanta.com" style="color: #2DB34A;">support@resuvanta.com</a>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${filename || 'Optimized_CV'}.pdf`,
          content: base64,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
