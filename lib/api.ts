import { NextResponse } from 'next/server';
import { ZodType } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const fail = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status });
export const respond = (error: unknown) => {
  if (error instanceof ApiError) return fail(error.status, error.code, error.message);
  // Do not include raw database/gateway errors, credentials or customer details in logs.
  console.error(JSON.stringify({ event: 'api_failure', type: error instanceof Error ? error.name : 'UnknownError', at: new Date().toISOString() }));
  return fail(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable');
};
export async function parse<T>(request: Request, schema: ZodType<T>, maxSize = 16384): Promise<T> {
  if (Number(request.headers.get('content-length') || 0) > maxSize) throw new ApiError(413, 'TOO_LARGE', 'Request too large');
  let data: unknown;
  try { const text = await request.text(); if (text.length > maxSize) throw new ApiError(413, 'TOO_LARGE', 'Request too large'); data = JSON.parse(text); } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'INVALID_JSON', 'Invalid JSON body'); }
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiError(400, 'INVALID_INPUT', result.error.issues.map(i => i.path.join('.') || 'body').join(', '));
  return result.data;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) throw new ApiError(403, 'ORIGIN', 'Invalid origin');
}
export function requireConfigured(...names: string[]) {
  if (names.some(n => !process.env[n] || /placeholder|xxxxx|your_|replace/i.test(process.env[n]!))) throw new ApiError(503, 'NOT_CONFIGURED', 'Checkout is not configured');
}
