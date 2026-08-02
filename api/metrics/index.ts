import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';

// Aggregate-only endpoint. Reads exclusively from metrics_snapshots — never
// joins participants/responses — so funders can never receive participant-
// level data through this route, regardless of filters applied.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin', 'funder']);
  if (!caller) return;

  const { cohort, from, to } = req.query;

  let query = supabaseAdmin.from('metrics_snapshots').select('*').order('period_start', { ascending: true });
  if (typeof cohort === 'string' && cohort) query = query.eq('cohort', cohort);
  if (typeof from === 'string' && from) query = query.gte('period_start', from);
  if (typeof to === 'string' && to) query = query.lte('period_end', to);

  const { data, error } = await query;
  if (error) return fail(res, 500, error.message);
  return ok(res, data);
}
