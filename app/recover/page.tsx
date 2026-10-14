'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function Recover() {
  const router = useRouter(), [token, setToken] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { const value = window.location.hash.slice(1); if (/^[a-f\d]{64}$/.test(value)) { setToken(value); window.history.replaceState(null, '', '/recover'); } }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try { const values = Object.fromEntries(new FormData(event.currentTarget)); const response = await fetch('/api/bookings/recover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token ? { action: 'redeem', token } : { action: 'request', ...values }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || 'Recovery unavailable. Please contact the club.'); if (result.reference) router.push(`/booking/${result.reference}`); else setMessage(result.message); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Recovery unavailable'); } finally { setBusy(false); }
  }
  return <main className="section page-main"><div className="container detail"><h1>Recover your booking</h1><p>Use your booking reference and the email used at checkout. We will send a private, single-use link.</p><form onSubmit={submit} className="card form-stack">{!token && <><label>Booking reference<input name="reference" required /></label><label>Booking email<input name="email" type="email" required /></label></>}<button className="btn btn-primary" disabled={busy}>{token ? 'Open my booking securely' : 'Email recovery link'}</button><p role="status">{message}</p></form><p>Lost your reference or unable to receive email? Contact the club for staff-assisted recovery.</p></div></main>;
}
