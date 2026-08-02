import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  event_type: z.enum(['upcoming', 'past']),
  event_date: z.string().min(1),
  cohort: z.string().optional(),
  location: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin', 'funder']);
    if (!caller) return;

    const { data: events, error } = await supabaseAdmin
      .from('program_events')
      .select('*')
      .order('event_date', { ascending: false });
    if (error) return fail(res, 500, error.message);

    const { data: kpis, error: kpisError } = await supabaseAdmin
      .from('program_kpis')
      .select('*')
      .eq('panel', 'cohort_achievements')
      .order('sort_order', { ascending: true });
    if (kpisError) return fail(res, 500, kpisError.message);

    const withKpis = (events ?? []).map((event) => ({
      ...event,
      kpis: (kpis ?? []).filter((kpi) => kpi.event_id === event.id),
    }));

    return ok(res, withKpis);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('program_events')
      .insert({ ...body, created_by: caller.userId })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    return ok(res, data, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
