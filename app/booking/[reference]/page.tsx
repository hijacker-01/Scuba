import BookingStatus from '@/components/BookingStatus';
export default async function BookingPage({ params }: { params: Promise<{ reference: string }> }) { const { reference } = await params; return <main className="section page-main"><div className="container"><BookingStatus reference={reference} /></div></main>; }
