import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { insertBooking } from '@/lib/models/Booking';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const booking = await insertBooking(db, body);
    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Booking failed' }, { status: 500 });
  }
}
