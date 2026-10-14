'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { catalog } from '@/lib/catalog';

type Slot = { id: string; startAt: string; endAt: string; pricePaise: number; seats: number };
type Terms = { name: string; terms: string; termsVersion: string };
type RazorpayCheckout = new (options: Record<string, unknown>) => { open(): void; on(event: string, callback: () => void): void };
declare global { interface Window { Razorpay?: RazorpayCheckout } }
const storageKey = 'hdc.checkout.attempt';
type Attempt = { fingerprint: string; key: string; reference?: string };
const readAttempt = (): Attempt | null => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } };
const saveAttempt = (attempt: Attempt) => { localStorage.setItem(storageKey, JSON.stringify(attempt)); };

export default function BookingFlow() {
  const query = useSearchParams(), router = useRouter();
  const [activity, setActivity] = useState(query.get('activity') || catalog[0].slug);
  const [activities, setActivities] = useState<readonly { slug: string; name: string }[]>(catalog);
  const [slots, setSlots] = useState<Slot[]>([]), [slotId, setSlotId] = useState(''), [participants, setParticipants] = useState(1);
  const [product, setProduct] = useState<Terms | null>(null), [accepted, setAccepted] = useState(false);
  const [state, setState] = useState(''), [busy, setBusy] = useState(false), [pendingReference, setPendingReference] = useState('');
  useEffect(() => { const resume = query.get('resume'); setPendingReference(resume && /^[a-f\d-]{36}$/i.test(resume) ? resume : readAttempt()?.reference || ''); }, [query]);
  useEffect(() => { let active = true; void fetch('/api/activities').then(r => r.json()).then(data => { if (active && Array.isArray(data.activities)) setActivities(data.activities); }).catch(() => {}); return () => { active = false; }; }, []);
  useEffect(() => {
    let current = true; setSlotId(''); setAccepted(false); setProduct(null);
    fetch(`/api/availability?activity=${encodeURIComponent(activity)}`).then(async r => { if (!r.ok) throw new Error('Availability is temporarily unavailable. Please contact us.'); return r.json(); }).then(data => { if (current) { setSlots(data.slots || []); setProduct(data.product || null); setState(''); } }).catch(error => { if (current) { setSlots([]); setState(error.message); } });
    return () => { current = false; };
  }, [activity]);
  const slot = slots.find(s => s.id === slotId);
  async function openPayment(reference: string, prefill: Record<string, unknown> = {}) {
    const response = await fetch('/api/payment/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference }) });
    const result = await response.json();
    if (!response.ok) {
      if (result.error?.code === 'EXPIRED') { localStorage.removeItem(storageKey); setPendingReference(''); }
      throw new Error(result.error?.message || 'Payment unavailable');
    }
    if (!window.Razorpay) throw new Error('Payment form could not load. Try Resume payment.');
    const checkout = new window.Razorpay({ key: result.key, amount: result.order.amount, currency: 'INR', name: 'Havelock Dive Club', order_id: result.order.id, prefill, modal: { ondismiss: () => { setBusy(false); setState('Payment window closed. Resume this reservation before it expires.'); } }, handler: async (payment: Record<string, string>) => {
      setState('Verifying payment…');
      try {
        const verified = await fetch('/api/payment/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference, ...payment }) });
        const value = await verified.json();
        if (!verified.ok) throw new Error(value.error?.message || 'Payment needs review');
        localStorage.removeItem(storageKey); router.push(`/booking/${reference}`);
      } catch { setState(`Payment verification is pending. Check booking ${reference} before paying again.`); }
      finally { setBusy(false); }
    } });
    checkout.on('payment.failed', () => { setBusy(false); setState('Payment failed. You can resume the same reservation.'); });
    checkout.open(); setState(`Reservation: ${reference}. Complete payment before the 15-minute hold expires.`);
  }
  async function resume() {
    if (busy || !pendingReference) return; setBusy(true);
    try { await openPayment(pendingReference); } catch (error) { setState(error instanceof Error ? error.message : 'Payment unavailable'); } finally { setBusy(false); }
  }
  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!slot || !product || !accepted || busy) return;
    setBusy(true); setState('Reserving your places…');
    const values = new FormData(event.currentTarget);
    const body = { slotId, participants, name: String(values.get('name')).trim(), email: String(values.get('email')), phone: String(values.get('phone')).trim(), acceptedTerms: true, termsVersion: product.termsVersion };
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
      const fingerprint = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      const prior = readAttempt();
      const attempt = prior?.fingerprint === fingerprint ? prior : { fingerprint, key: crypto.randomUUID() };
      saveAttempt(attempt); // Persist before sending: a lost response must reuse the same key.
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not reserve');
      const reference = result.booking.reference;
      saveAttempt({ ...attempt, reference }); setPendingReference(reference);
      if (result.booking.status !== 'pending') { router.push(`/booking/${reference}`); return; }
      await openPayment(reference, { name: body.name, email: body.email, contact: body.phone });
    } catch (error) { setState(error instanceof Error ? error.message : 'Booking unavailable'); }
    finally { setBusy(false); }
  }
  return <div className="detail"><h1>Book your dive</h1><p>Choose a published departure. All prices are shown before payment. Departure times use India time (IST).</p><p><Link href="/recover">Recover a booking on another device</Link></p>
    {pendingReference && <aside className="card checkout-recovery"><p>Saved reservation: {pendingReference}</p><Link href={`/booking/${pendingReference}`}>Check booking status</Link> <button type="button" onClick={() => void resume()} disabled={busy}>Resume payment</button><p>Check its status before starting a different reservation.</p></aside>}
    <form onSubmit={checkout} className="card form-stack"><label>Activity<select value={activity} onChange={e => setActivity(e.target.value)}>{activities.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><label>Available departure<select required value={slotId} onChange={e => setSlotId(e.target.value)}><option value="">Select a departure</option>{slots.map(s => <option key={s.id} value={s.id}>{new Date(s.startAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST · ₹{(s.pricePaise / 100).toLocaleString('en-IN')} per person · {s.seats} seats</option>)}</select></label>{!slots.length && !state && <p>No departures are available yet. Please contact us for dates.</p>}<label>Participants<input type="number" min="1" max={Math.min(20, slot?.seats || 20)} value={participants} onChange={e => setParticipants(Number(e.target.value))} required /></label><label>Full name<input name="name" minLength={2} required /></label><label>Email<input type="email" name="email" required /></label><label>Phone<input type="tel" name="phone" minLength={7} required /></label>
    {product && <section className="checkout-terms"><h2>{product.name}: booking terms</h2><p className="policy-copy">{product.terms}</p><label className="checkbox-label"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required />I have read and accept these activity terms.</label><Link href="/policies">Privacy and cancellation policies</Link></section>}
    {slot && <p className="total">Total: ₹{(slot.pricePaise * participants / 100).toLocaleString('en-IN')}</p>}<button className="btn btn-primary" disabled={!slot || !accepted || busy}>Reserve and pay</button><p role="status">{state}</p></form></div>;
}


