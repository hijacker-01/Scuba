import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getRazorpayInstance } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const { amount, course } = await request.json();
    const razorpay = getRazorpayInstance();

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
