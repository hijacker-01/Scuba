'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountSecurity({ owner }: { owner: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget, body = Object.fromEntries(new FormData(form));
    if (body.newPassword !== body.confirmPassword) { setMessage('New passwords do not match.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Password could not be changed.');
      form.reset(); router.replace('/admin/login?passwordChanged=1');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Password could not be changed.'); }
    finally { setBusy(false); }
  }
  async function backupKeys(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget, data = new FormData(form);
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value');
    if (action !== 'rotate' && action !== 'export') return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/backup-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: data.get('currentPassword'), action }) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error?.message || 'Backup keys could not be updated.'); }
      const url = URL.createObjectURL(await response.blob()), link = document.createElement('a');
      link.href = url; link.download = `havelock-backup-recovery-keys-${Date.now()}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      form.reset();
      setMessage(action === 'rotate' ? 'Key rotated for future backups. Recovery-key download requested. Save the file outside Railway. If the download was blocked, use Download recovery keys again.' : 'Recovery-key download requested. Save the file privately outside Railway.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Backup keys could not be updated.'); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="account-security-title">
    <h2 id="account-security-title">Account security</h2>
    <details className="card"><summary>Change my password</summary>
      <p>Use a memorable passphrase with at least 16 characters. Changing it signs you out on every device.</p>
      <form className="form-stack" onSubmit={changePassword}>
        <label>Current password<input type="password" name="currentPassword" autoComplete="current-password" maxLength={200} required disabled={busy} /></label>
        <label>New password<input type="password" name="newPassword" autoComplete="new-password" minLength={16} maxLength={72} required disabled={busy} /></label>
        <label>Confirm new password<input type="password" name="confirmPassword" autoComplete="new-password" minLength={16} maxLength={72} required disabled={busy} /></label>
        <button className="btn btn-primary" disabled={busy}>Change password and sign out</button>
      </form>
    </details>
    {owner && <details className="card"><summary>Backup recovery keys</summary>
      <p>Rotate the encryption key for future backups. Existing backups keep their original keys. A backup already running may still use the previous key.</p>
      <p>The downloaded recovery file contains all backup decryption keys, including older ones. Keep it in a password manager or another private place outside Railway. Your login password and backup keys are separate.</p>
      <form className="form-stack" onSubmit={backupKeys}>
        <label>Current owner password<input type="password" name="currentPassword" autoComplete="current-password" maxLength={200} required disabled={busy} /></label>
        <label className="checkbox-label"><input type="checkbox" name="acknowledged" required disabled={busy} /> I will save the recovery-key file privately outside Railway.</label>
        <button type="submit" name="action" value="export" disabled={busy}>Download recovery keys</button>
        <button type="submit" name="action" value="rotate" disabled={busy}>Rotate key and download recovery keys</button>
      </form>
    </details>}
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
