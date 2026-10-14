import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import { bookingInput } from '../lib/booking';
import { validSignature } from '../lib/payment';
import { termsVersion } from '../lib/products';

describe('booking and payment boundaries', () => {
  it('requires explicit acceptance and a terms version', () => {
    const input = { slotId: 'a'.repeat(24), participants: 1, name: 'Test Diver', email: 'diver@example.com', phone: '1234567890' };
    expect(bookingInput.safeParse(input).success).toBe(false);
    expect(bookingInput.safeParse({ ...input, acceptedTerms: false, termsVersion: termsVersion('Terms') }).success).toBe(false);
    expect(bookingInput.safeParse({ ...input, acceptedTerms: true, termsVersion: termsVersion('Terms') }).success).toBe(true);
  });
  it('rejects client-controlled price and status', () => {
    expect(bookingInput.safeParse({ slotId: 'a'.repeat(24), participants: 1, name: 'Test Diver', email: 'diver@example.com', phone: '1234567890', amount: 1, status: 'confirmed' }).success).toBe(false);
  });
  it('rejects zero and excessive participant counts', () => {
    for (const participants of [0, 21]) expect(bookingInput.safeParse({ slotId: 'a'.repeat(24), participants, name: 'Test Diver', email: 'diver@example.com', phone: '1234567890' }).success).toBe(false);
  });
  it('checks signatures in constant time against the configured message', () => {
    const secret = 'test-secret'; const signature = createHmac('sha256', secret).update('order_1|pay_1').digest('hex');
    expect(validSignature('order_1|pay_1', signature, secret)).toBe(true);
    expect(validSignature('order_2|pay_1', signature, secret)).toBe(false);
    expect(validSignature('order_1|pay_1', 'bad', secret)).toBe(false);
  });
});
