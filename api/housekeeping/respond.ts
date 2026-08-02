import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const respondSchema = z.object({
  item_key: z.string().min(1),
  response: z.enum(['yes', 'no', 'maybe']),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const body = parseBody(res, respondSchema, req.body);
  if (!body) return;

  const { data, error } = await supabaseAdmin
    .from('housekeeping_responses')
    .upsert(
      { item_key: body.item_key, response: body.response, responded_by: caller.userId, responded_at: new Date().toISOString() },
      { onConflict: 'item_key' },
    )
    .select()
    .single();
  if (error) return fail(res, 500, error.message);

  return ok(res, data);
}
