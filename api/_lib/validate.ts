import type { VercelResponse } from '@vercel/node';
import type { ZodType } from 'zod';
import { fail } from './respond.js';

export function parseBody<T>(res: VercelResponse, schema: ZodType<T>, body: unknown): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    fail(res, 400, result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    return null;
  }
  return result.data;
}
