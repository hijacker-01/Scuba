'use client';
import { FormEvent, useState } from 'react';

export default function Contact({ phone = '+919434290393', alternatePhone = '+919679572772', location = 'Havelock Island, Andaman Islands' }: { phone?: string; alternatePhone?: string; location?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState('sending');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (!result.ok) throw new Error('Could not send enquiry');
      form.reset(); setState('sent');
    } catch { setState('error'); }
  }
  return <section id="contact" className="section contact-section"><div className="container two-column"><div><h2>Questions about diving or courses?</h2><p>Ask our team about diving experiences, course options, and available dates.</p><p><a href={`tel:${phone}`}>{phone}</a> · <a href={`tel:${alternatePhone}`}>{alternatePhone}</a></p><p>{location}</p></div><form onSubmit={submit} className="card form-stack"><label>Full name<input name="name" required minLength={2} maxLength={100} /></label><label>Email<input name="email" type="email" required /></label><label>Phone<input name="phone" type="tel" maxLength={20} /></label><label>Interested in<select name="service" required><option value="Diving">Diving</option><option value="Courses">Courses</option></select></label><label>Message<textarea name="message" required minLength={5} maxLength={2000} /></label><button className="btn btn-primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send enquiry'}</button><p role="status">{state === 'sent' ? 'Your enquiry was saved. We will be in touch.' : state === 'error' ? 'Could not save your enquiry. Please call or try again.' : ''}</p></form></div></section>;
}

