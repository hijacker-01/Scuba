'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Booking = { reference: string; productName: string; startAt: string; status: string; participants: number; totalPaise: number; refundedPaise: number; terms: string; termsAcceptedAt?: string };
export default function BookingStatus({ reference }: { reference: string }) {
  const [booking, setBooking] = useState<Booking | null>(null); const [error, setError] = useState('');
  useEffect(() => { let active = true; const refresh = () => fetch(`/api/bookings/${reference}`).then(r => r.json()).then(result => { if (!active) return; if (result.booking) setBooking(result.booking); else setError(result.error?.message || 'Booking unavailable'); }).catch(() => { if (active) setError('Booking unavailable'); }); void refresh(); const timer = setInterval(refresh, 10000); return () => { active = false; clearInterval(timer); }; }, [reference]);
  return <div className="detail"><h1>Booking status</h1>{booking ? <div className="card"><p>Reference: {booking.reference}</p><p>Status: <strong>{booking.status.replaceAll('_', ' ')}</strong></p><p>{booking.productName} · {booking.participants} participant(s)</p><p>{new Date(booking.startAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' })}</p><p>Booking total: ₹{(booking.totalPaise / 100).toLocaleString('en-IN')}</p><p>Processed refunds: ₹{((booking.refundedPaise || 0) / 100).toLocaleString('en-IN')}</p><details><summary>Your accepted terms</summary><p className="policy-copy">{booking.terms}</p></details>{booking.status === 'pending' && <p><Link className="btn btn-primary" href={`/book?resume=${booking.reference}`}>Resume secure payment</Link></p>}{booking.status === 'payment_review' && <p>Our team is reviewing your payment. Please contact us with your reference.</p>}</div> : <p role="status">{error || 'Loading…'}</p>}</div>;
}



