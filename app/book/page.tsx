import { Suspense } from 'react';
import Script from 'next/script';
import BookingFlow from '@/components/BookingFlow';

export default function BookPage() { return <main className="section page-main"><div className="container"><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" /><Suspense fallback={<p>Loading departures…</p>}><BookingFlow /></Suspense></div></main>; }
