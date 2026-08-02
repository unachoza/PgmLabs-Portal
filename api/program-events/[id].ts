import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  event_type: z.enum(['upcoming', 'past']).optional(),
  event_date: z.string().min(1).optional(),
  cohort: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing event id.');

  if (req.method === 'PATCH') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, updateSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('program_events')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'DELETE') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const { error } = await supabaseAdmin.from('program_events').delete().eq('id', id);
    if (error) return fail(res, 500, error.message);
    return ok(res, { id });
  }

  return fail(res, 405, 'Method not allowed.');
}
