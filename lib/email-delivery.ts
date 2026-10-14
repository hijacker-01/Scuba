import { createHash } from 'crypto';
import nodemailer from 'nodemailer';
export async function deliverEmail(id: string, to: string, subject: string, text: string) {
  if (process.env.EMAIL_PROVIDER === 'resend') {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Email API not configured');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': createHash('sha256').update(id).digest('hex') },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text, ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}) })
    });
    if (!response.ok) throw new Error('Email API delivery failed');
    const result = await response.json();
    if (!result.id) throw new Error('Email API acknowledgement missing');
    return;
  }
  if (process.env.EMAIL_PROVIDER && process.env.EMAIL_PROVIDER !== 'smtp') throw new Error('Unsupported email provider');
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text, messageId: `<${id.replace(/[^\w.-]/g, '-')}@havelock-notifications>` });
}
