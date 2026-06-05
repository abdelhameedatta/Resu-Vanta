import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: 'support@resuvanta.com', // الإيميل بتاعك
        pass: 'GuJYy4cFgzvQ',          // الباسورد اللي ظاهر في صورة image_990e62.png
      },
    });

    await transporter.sendMail({
      from: `"ResuVanta Contact" <support@resuvanta.com>`,
      to: 'support@resuvanta.com',
      replyTo: email,
      subject: `[ResuVanta] ${subject}`,
      html: `
        <h3>New message from ResuVanta</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Subject:</b> ${subject}</p>
        <p><b>Message:</b></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
