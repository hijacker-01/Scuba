'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OwnerControls, { Product } from './OwnerControls';
import { indiaDateTime, toIndiaInput } from '@/lib/india-time';
import type { ClubSettings } from '@/lib/settings';

type Booking = { reference: string; name: string; email: string; phone: string; productSlug: string; productName: string; startAt: string; participants: number; totalPaise: number; refundedPaise: number; status: string; paymentId?: string; orderId?: string; termsAcceptedAt?: string; terms: string; lastReconcileError?: string };
type Enquiry = { _id: string; name: string; email: string; phone: string; service: string; message: string; status: string };
type Slot = { _id: string; productSlug: string; startAt: string; endAt: string; reserved: number; capacity: number; pricePaise: number; closed: boolean; published: boolean };
type Overview = { role: string; email: string; bookings: Booking[]; enquiries: Enquiry[]; products: Product[]; slots: Slot[]; revenuePaise: number; pagination: { page: number; enquiryPage: number; slotPage: number; limit: number; bookingCount: number; enquiryCount: number; slotCount: number }; settings: ClubSettings; accounts: { email: string; role: string; active: boolean }[]; notifications: { _id: string; to: string; subject?: string; status: string; attempts: number; lastError?: string }[]; workerHealth: { key: string; lastSuccessAt: string }[]; services: { database: boolean; payments: boolean; email: boolean; scheduler: boolean }; audit: { _id: string; action: string; reference?: string; createdAt: string }[] };
const money = (amount: number) => '₹' + (amount / 100).toLocaleString('en-IN');
const date = (value: string) => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
function Pagination({ page, total, limit, change }: { page: number; total: number; limit: number; change: (page: number) => void }) {
  return <div className="staff-pagination"><button disabled={page <= 1} onClick={() => change(page - 1)}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(total / limit))} · {total} records</span><button disabled={page * limit >= total} onClick={() => change(page + 1)}>Next</button></div>;
}
export default function StaffDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null), [message, setMessage] = useState('Loading…'), [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1), [enquiryPage, setEnquiryPage] = useState(1), [slotPage, setSlotPage] = useState(1), [past, setPast] = useState(false);
  const [targetSlots, setTargetSlots] = useState<Record<string, string>>({}), [slotProduct, setSlotProduct] = useState('');
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
  async function slotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await send('/api/admin/slots', 'POST', { productSlug: values.productSlug, startAt: indiaDateTime(String(values.startAt)), endAt: indiaDateTime(String(values.endAt)), capacity: Number(values.capacity), pricePaise: Math.round(Number(values.priceRupees) * 100), published: true }); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Invalid departure date'); }
  }
  async function logout() { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); }
  async function changeDepartureTime(slot: Slot) {
    const start = window.prompt('New start in India time (YYYY-MM-DDTHH:mm). Only departures without reserved seats can be moved.', toIndiaInput(slot.startAt));
    if (!start) return; const end = window.prompt('New end in India time (YYYY-MM-DDTHH:mm)', toIndiaInput(slot.endAt)); if (!end) return;
    try { await send(`/api/admin/slots/${slot._id}`, 'PATCH', { startAt: indiaDateTime(start), endAt: indiaDateTime(end) }); } catch (error) { setMessage(error instanceof Error ? error.message : 'Invalid date'); }
  }
  return <div className="container staff"><div className="staff-heading"><div><p className="section-kicker">CLUB MANAGEMENT</p><h1>{data?.role === 'owner' ? 'Owner dashboard' : 'Staff dashboard'}</h1>{data && <p>{data.email}</p>}</div><button onClick={() => void logout()}>Sign out</button></div><p role="status">{message}</p>
  {data && <>
    <div className="catalog-grid"><div className="card"><strong>{data.pagination.bookingCount}</strong><p>Bookings matching filters</p></div><div className="card"><strong>{data.pagination.enquiryCount}</strong><p>Enquiries</p></div><div className="card"><strong>{money(data.revenuePaise)}</strong><p>Captured payments less processed refunds</p></div></div>
    <h2>Bookings and payment review</h2><form className="staff-filters" onSubmit={e => { e.preventDefault(); setSearch(String(new FormData(e.currentTarget).get('search') || '')); setPage(1); }}><label>Search customer, reference or payment<input name="search" defaultValue={search} /></label><button>Search</button><label>Status<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All</option>{['pending', 'confirmed', 'expired', 'cancelled', 'payment_review', 'refund_required', 'refunded'].map(s => <option key={s}>{s}</option>)}</select></label></form>
    <div className="table-wrap"><table><thead><tr><th>Reference / payment</th><th>Customer</th><th>Activity / departure</th><th>Status / amount</th><th>Actions</th></tr></thead><tbody>{data.bookings.map(b => <tr key={b.reference}><td className="staff-reference">{b.reference}<br />{b.paymentId || 'No captured payment'}<br />{b.orderId || 'No order'}<details><summary>Accepted terms</summary><p>{b.termsAcceptedAt ? date(b.termsAcceptedAt) : 'Legacy booking: acceptance not recorded'}</p><p className="policy-copy">{b.terms}</p></details></td><td>{b.name}<br /><a href={`mailto:${b.email}`}>{b.email}</a><br /><a href={`tel:${b.phone}`}>{b.phone}</a><br />{b.participants} participant(s)</td><td>{b.productName}<br />{date(b.startAt)}</td><td><strong>{b.status.replaceAll('_', ' ')}</strong><br />{money(b.totalPaise)}<br />Refunded: {money(b.refundedPaise)}{b.lastReconcileError && <p>{b.lastReconcileError}</p>}</td><td className="staff-actions">
      {b.orderId && <button disabled={busy} onClick={() => void send(`/api/admin/bookings/${b.reference}`, 'PATCH', { action: 'sync_payment' })}>Check gateway / refunds</button>}
      {['pending', 'confirmed', 'payment_review', 'partial_refund_review'].includes(b.status) && <button disabled={busy} onClick={() => { if (window.confirm('Cancel this booking and release its seats? Any refund due must be issued separately in Razorpay.')) void send(`/api/admin/bookings/${b.reference}`, 'PATCH', { action: 'cancel' }); }}>Cancel booking</button>}
      {['pending', 'confirmed', 'payment_review'].includes(b.status) && <><label>New departure<select value={targetSlots[b.reference] || ''} onChange={e => setTargetSlots({ ...targetSlots, [b.reference]: e.target.value })}><option value="">Choose from departure page below</option>{data.slots.filter(s => s.productSlug === b.productSlug && !s.closed && s.published && s.pricePaise === b.totalPaise / b.participants && new Date(s.startAt) > new Date()).map(s => <option key={s._id} value={s._id}>{date(s.startAt)} · {s.capacity - s.reserved} seats</option>)}</select></label><button disabled={busy || !targetSlots[b.reference]} onClick={() => { if (b.status === 'payment_review') { const note = window.prompt('Reason for confirming this reviewed payment (at least 5 characters)'); if (note) void send(`/api/admin/bookings/${b.reference}`, 'PATCH', { action: 'confirm_review', slotId: targetSlots[b.reference], note }); } else void send(`/api/admin/bookings/${b.reference}`, 'PATCH', { action: 'reschedule', slotId: targetSlots[b.reference] }); }}>{b.status === 'payment_review' ? 'Confirm reviewed payment' : 'Reschedule'}</button></>}
      {b.status === 'refund_required' && <p>Issue the approved refund in Razorpay, then check gateway/refunds here.</p>}
    </td></tr>)}</tbody></table></div><Pagination page={page} total={data.pagination.bookingCount} limit={data.pagination.limit} change={setPage} />
    <h2>Enquiries</h2><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Service</th><th>Message</th><th>Status</th></tr></thead><tbody>{data.enquiries.map(e => <tr key={e._id}><td>{e.name}<br />{e.email}<br />{e.phone}</td><td>{e.service}</td><td>{e.message}</td><td><select disabled={busy} value={e.status} onChange={event => void send(`/api/admin/enquiries/${e._id}`, 'PATCH', { status: event.target.value })}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table></div><Pagination page={enquiryPage} total={data.pagination.enquiryCount} limit={data.pagination.limit} change={setEnquiryPage} />
    {data.role === 'owner' && <OwnerControls products={data.products} settings={data.settings} accounts={data.accounts} send={send} busy={busy} />}
    <h2>Departures and course cohorts</h2><p>All entries below use India time (IST, UTC+05:30), regardless of the computer timezone.</p><form className="card form-stack staff-departure-form" onSubmit={slotSubmit}><label>Published activity<select name="productSlug" value={slotProduct} onChange={e => setSlotProduct(e.target.value)} required><option value="">Choose activity</option>{data.products.filter(p => p.published).map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select></label><label>Start (India time)<input name="startAt" type="datetime-local" required /></label><label>End (India time)<input name="endAt" type="datetime-local" required /></label><label>Seats<input name="capacity" type="number" min="1" max="100" required /></label><label>Price per person (₹)<input key={slotProduct + String(data.products.find(p => p.slug === slotProduct)?.pricePaise)} name="priceRupees" type="number" min="1" step="0.01" defaultValue={data.products.find(p => p.slug === slotProduct)?.pricePaise ? data.products.find(p => p.slug === slotProduct)!.pricePaise! / 100 : ''} required /></label><button className="btn btn-primary" disabled={busy}>Add departure</button></form>
    <label className="checkbox-label"><input type="checkbox" checked={past} onChange={e => { setPast(e.target.checked); setSlotPage(1); }} />Include past departures</label><div className="table-wrap"><table><thead><tr><th>ID / activity</th><th>Start (India time)</th><th>Seats</th><th>Price</th><th>Action</th></tr></thead><tbody>{data.slots.map(s => <tr key={s._id}><td className="staff-reference">{s._id}<br />{s.productSlug}</td><td>{date(s.startAt)}</td><td>{s.reserved}/{s.capacity}</td><td>{money(s.pricePaise)}</td><td><button disabled={busy} onClick={() => void send(`/api/admin/slots/${s._id}`, 'PATCH', { closed: !s.closed })}>{s.closed ? 'Reopen' : 'Close'}</button> <button disabled={busy || s.reserved > 0} onClick={() => void changeDepartureTime(s)}>Change time</button> <button disabled={busy} onClick={() => { const price = window.prompt('New price per person (₹)', String(s.pricePaise / 100)); if (price && Number(price) >= 1) void send(`/api/admin/slots/${s._id}`, 'PATCH', { pricePaise: Math.round(Number(price) * 100) }); }}>Change price</button> <button disabled={busy} onClick={() => { const capacity = window.prompt('Total seats', String(s.capacity)); if (capacity && Number.isInteger(Number(capacity))) void send(`/api/admin/slots/${s._id}`, 'PATCH', { capacity: Number(capacity) }); }}>Change seats</button></td></tr>)}</tbody></table></div><Pagination page={slotPage} total={data.pagination.slotCount} limit={data.pagination.limit} change={setSlotPage} />
    <h2>Email delivery</h2><p>Pending emails are sent by the scheduled email worker. Failed emails can be retried after correcting the sender or recipient issue.</p><div className="table-wrap"><table><thead><tr><th>Recipient</th><th>Message</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.notifications.map(n => <tr key={n._id}><td>{n.to}</td><td>{n.subject || 'Legacy booking confirmation'}</td><td>{n.status} · {n.attempts} attempt(s)<br />{n.lastError}</td><td>{n.status === 'failed' && <button disabled={busy} onClick={() => void send('/api/admin/notifications', 'POST', { id: n._id })}>Retry email</button>}</td></tr>)}</tbody></table></div>
    <h2>Service readiness</h2><div className="card">{Object.entries(data.services).map(([name, ready]) => <p key={name}>{name}: {ready ? 'Configuration present; verify on staging' : 'Setup required'}</p>)}{data.workerHealth.map(worker => <p key={worker.key}>{worker.key} worker last successful run: {date(worker.lastSuccessAt)}</p>)}{!data.workerHealth.length && <p>No successful worker runs recorded. Configure and verify both scheduled jobs.</p>}</div><h2>Recent management actions</h2><ul>{data.audit.map(a => <li key={a._id}>{date(a.createdAt)} · {a.action}{a.reference ? ' · ' + a.reference : ''}</li>)}</ul>
  </>}
  </div>;
}



