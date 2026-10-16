'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function Login() {
  const router = useRouter(); const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { if (new URLSearchParams(window.location.search).get('passwordChanged') === '1') setNotice('Password changed. Sign in with your new password.'); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget).entries()); const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); if (response.ok) router.push('/admin'); else setError(result.error?.message || 'Sign in failed'); }
  return <main className="section page-main"><div className="container detail"><h1>Owner / staff login</h1><p>Sign in to manage enquiries. Owners can also update activities, prices, club information, policies and team access.</p><p role="status">{notice}</p><form className="card form-stack" onSubmit={submit}><label>Email<input type="email" name="email" autoComplete="username" required /></label><label>Password<input type="password" name="password" autoComplete="current-password" required /></label><button className="btn btn-primary">Sign in</button><p role="alert">{error}</p></form></div></main>;
}
