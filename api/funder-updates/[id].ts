import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const updateSchema = z.object({
  follow_up_status: z.enum(['none', 'pending', 'complete']).optional(),
  summary: z.string().min(1).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing id.');

  const body = parseBody(res, updateSchema, req.body);
  if (!body) return;

  const { data, error } = await supabaseAdmin.from('funder_updates').update(body).eq('id', id).select().single();
  if (error) return fail(res, 500, error.message);
  return ok(res, data);
}
