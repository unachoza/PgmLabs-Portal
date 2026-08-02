import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const createSchema = z
  .object({
    panel: z.enum(['cohort_achievements', 'resource_center_activity']),
    event_id: z.string().uuid().optional(),
    label: z.string().min(1),
    value: z.string().min(1),
    period_label: z.string().optional(),
    sort_order: z.number().int().optional(),
  })
  .refine((body) => body.panel !== 'cohort_achievements' || Boolean(body.event_id), {
    message: 'event_id is required for cohort_achievements KPIs.',
    path: ['event_id'],
  });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin', 'funder']);
    if (!caller) return;

    const { panel } = req.query;
    let query = supabaseAdmin.from('program_kpis').select('*').order('sort_order', { ascending: true });
    if (typeof panel === 'string' && panel) query = query.eq('panel', panel);

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('program_kpis')
      .insert({ ...body, created_by: caller.userId })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    return ok(res, data, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
