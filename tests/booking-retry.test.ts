import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ findOne: vi.fn(), transaction: vi.fn() }));
vi.mock('../lib/db', () => ({
  database: async () => ({ collection: () => ({ findOne: mock.findOne }) }),
  withTransaction: mock.transaction,
}));

import { reserve } from '../lib/booking';

const input = { slotId: 'a'.repeat(24), participants: 1, name: 'Test Diver', email: 'diver@example.com', phone: '1234567890', acceptedTerms: true as const, termsVersion: 'c'.repeat(64) };
const prior = { ...input, slotId: input.slotId, reference: 'existing-booking' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('MONGODB_URI', 'mongodb://localhost/test');
  vi.stubEnv('SESSION_SECRET', 'tests-only-session-secret');
  // Expiration cleanup succeeds; the reservation then loses an insert race.
  mock.transaction.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('E11000 duplicate key'));
  mock.findOne.mockResolvedValueOnce(null);
});

describe('reservation insert races', () => {
  it('returns the existing reservation for the same request', async () => {
    mock.findOne.mockResolvedValueOnce(prior);
    await expect(reserve(input, 'same-request-key')).resolves.toMatchObject({ reference: prior.reference });
  });

  it.each([
    { email: 'someone-else@example.com' },
    { slotId: 'b'.repeat(24) },
    { participants: 2 },
  ])('rejects a key won by a different request: %j', async changes => {
    mock.findOne.mockResolvedValueOnce({ ...prior, ...changes });
    await expect(reserve(input, 'conflicting-request-key')).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('preserves an unrelated duplicate-key error when no booking exists', async () => {
    mock.findOne.mockResolvedValueOnce(null);
    await expect(reserve(input, 'unrelated-duplicate-key')).rejects.toThrow('E11000');
  });
});
