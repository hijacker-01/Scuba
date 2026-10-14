import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getRazorpayInstance } from '@/lib/razorpay';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    const razorpay = getRazorpayInstance();

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpay.key_secret!)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return NextResponse.json({ success: true, message: 'Payment verified' });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
