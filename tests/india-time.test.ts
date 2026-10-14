import { describe, expect, it } from 'vitest';
import { indiaDateTime, toIndiaInput } from '../lib/india-time';
describe('India departure entry', () => {
  it.each(['UTC', 'America/Los_Angeles', 'Europe/London'])('converts a staff entry independently of %s device time', tz => {
    const previous = process.env.TZ; process.env.TZ = tz;
    try { expect(indiaDateTime('2026-10-20T09:30')).toBe('2026-10-20T04:00:00.000Z'); expect(toIndiaInput('2026-10-20T04:00:00.000Z')).toBe('2026-10-20T09:30'); } finally { process.env.TZ = previous; }
  });
  it('rejects malformed and nonexistent calendar dates', () => { expect(() => indiaDateTime('2026-02-30T09:30')).toThrow(); expect(() => indiaDateTime('tomorrow')).toThrow(); });
});
