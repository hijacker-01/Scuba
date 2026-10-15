'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OwnerControls, { Product } from './OwnerControls';
import type { ClubSettings } from '@/lib/settings';

type Booking = { reference: string; name: string; email: string; phone: string; productSlug: string; productName: string; startAt: string; participants: number; totalPaise: number; refundedPaise: number; status: string; paymentId?: string; orderId?: string; termsAcceptedAt?: string; terms: string; lastReconcileError?: string };
type Enquiry = { _id: string; name: string; email: string; phone: string; service: string; message: string; status: string };
type Slot = { _id: string; productSlug: string; startAt: string; endAt: string; reserved: number; capacity: number; pricePaise: number; closed: boolean; published: boolean };
type Overview = { role: string; email: string; bookings: Booking[]; enquiries: Enquiry[]; products: Product[]; slots: Slot[]; revenuePaise: number; pagination: { page: number; enquiryPage: number; slotPage: number; limit: number; bookingCount: number; enquiryCount: number; slotCount: number }; settings: ClubSettings; accounts: { email: string; role: string; active: boolean }[]; notifications: { _id: string; to: string; subject?: string; status: string; attempts: number; lastError?: string }[]; workerHealth: { key: string; lastSuccessAt: string }[]; services: { database: boolean; payments: boolean; email: boolean; scheduler: boolean }; audit: { _id: string; action: string; reference?: string; createdAt: string }[] };
const date = (value: string) => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
function Pagination({ page, total, limit, change }: { page: number; total: number; limit: number; change: (page: number) => void }) {
  return <div className="staff-pagination"><button disabled={page <= 1} onClick={() => change(page - 1)}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(total / limit))} · {total} records</span><button disabled={page * limit >= total} onClick={() => change(page + 1)}>Next</button></div>;
}
export default function StaffDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null), [message, setMessage] = useState('Loading…'), [busy, setBusy] = useState(false);
  const [search] = useState(''), [status] = useState(''), [page] = useState(1), [enquiryPage, setEnquiryPage] = useState(1), [slotPage] = useState(1), [past] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams({ search, status, page: String(page), enquiryPage: String(enquiryPage), slotPage: String(slotPage), past: String(past) });
      const response = await fetch('/api/admin/overview?' + params);
      if (response.status === 401) { router.push('/admin/login'); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not load dashboard');
      setData(result); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load dashboard'); }
  }, [router, search, status, page, enquiryPage, slotPage, past]);
  useEffect(() => { void refresh(); }, [refresh]);
  async function send(path: string, method: string, value: Record<string, unknown>) {
    if (busy) return false; setBusy(true);
    try {
      const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not save');
      await refresh(); setMessage('Saved'); return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save'); return false; }
    finally { setBusy(false); }
  }
  async function logout() { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); }
  return <div className="container staff"><div className="staff-heading"><div><p className="section-kicker">CLUB MANAGEMENT</p><h1>{data?.role === 'owner' ? 'Owner dashboard' : 'Staff dashboard'}</h1>{data && <p>{data.email}</p>}</div><button onClick={() => void logout()}>Sign out</button></div><p role="status">{message}</p>
  {data && <>
    <div className="card"><strong>{data.pagination.enquiryCount}</strong><p>Customer enquiries</p></div>
    <h2>Enquiries</h2><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Service</th><th>Message</th><th>Status</th></tr></thead><tbody>{data.enquiries.map(e => <tr key={e._id}><td>{e.name}<br />{e.email}<br />{e.phone}</td><td>{e.service}</td><td>{e.message}</td><td><select disabled={busy} value={e.status} onChange={event => void send(`/api/admin/enquiries/${e._id}`, 'PATCH', { status: event.target.value })}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table></div><Pagination page={enquiryPage} total={data.pagination.enquiryCount} limit={data.pagination.limit} change={setEnquiryPage} />
    {data.role === 'owner' && <OwnerControls products={data.products} settings={data.settings} accounts={data.accounts} send={send} busy={busy} />}
    <h2>Email delivery</h2><p>Pending emails are sent by the scheduled email worker. Failed emails can be retried after correcting the sender or recipient issue.</p><div className="table-wrap"><table><thead><tr><th>Recipient</th><th>Message</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.notifications.map(n => <tr key={n._id}><td>{n.to}</td><td>{n.subject || 'Legacy booking confirmation'}</td><td>{n.status} · {n.attempts} attempt(s)<br />{n.lastError}</td><td>{n.status === 'failed' && <button disabled={busy} onClick={() => void send('/api/admin/notifications', 'POST', { id: n._id })}>Retry email</button>}</td></tr>)}</tbody></table></div>
    <h2>Service readiness</h2><div className="card">{Object.entries(data.services).map(([name, ready]) => <p key={name}>{name}: {ready ? 'Configuration present; verify on staging' : 'Setup required'}</p>)}{data.workerHealth.filter(worker => worker.key === 'notifications').map(worker => <p key={worker.key}>{worker.key} worker last successful run: {date(worker.lastSuccessAt)}</p>)}{!data.workerHealth.length && <p>No successful worker runs recorded. Configure and verify the email worker.</p>}</div><h2>Recent management actions</h2><ul>{data.audit.map(a => <li key={a._id}>{date(a.createdAt)} · {a.action}{a.reference ? ' · ' + a.reference : ''}</li>)}</ul>
  </>}
  </div>;
}



