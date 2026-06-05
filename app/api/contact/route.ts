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
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
      // السطر ده بيحل مشاكل شهادات الأمان اللي بتعمل رفض للإرسال
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"ResuVanta Contact" <${process.env.ZOHO_EMAIL}>`,
      to: process.env.ZOHO_EMAIL,
      replyTo: email,
      subject: `[ResuVanta] ${subject}`,
      html: `
        <h3>New message from ResuVanta Contact Form</h3>
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
