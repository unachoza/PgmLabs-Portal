import type { VercelResponse } from '@vercel/node';

export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export function ok<T>(res: VercelResponse, data: T, status = 200) {
  return res.status(status).json({ success: true, data, error: null } satisfies ApiEnvelope<T>);
}

export function fail(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, data: null, error } satisfies ApiEnvelope<null>);
}
