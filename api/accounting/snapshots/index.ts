import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../../_lib/auth';
import { supabaseAdmin } from '../../_lib/supabaseAdmin';
import { ok, fail } from '../../_lib/respond';

// Normalized company-level P&L. Admin (all, filterable) + participant (own only).
// NO funder role — funders get financials solely as aggregates via /api/metrics.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin', 'participant']);
  if (!caller) return;

  const { cohort, from, to } = req.query;

  let query = supabaseAdmin
    .from('pnl_snapshots')
    .select(
      'id, connection_id, participant_id, cohort, provider, currency, period_start, period_end, revenue, cogs, payroll, other_opex, net_result, source, pulled_at, accounting_connections(external_company_name), participants(company_name, profiles(name))',
    )
    .order('period_start', { ascending: true });

  if (caller.role === 'participant') {
    const { data: me } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('profile_id', caller.userId)
      .single();
    if (!me) return ok(res, []);
    query = query.eq('participant_id', me.id);
  }

  if (typeof cohort === 'string' && cohort) query = query.eq('cohort', cohort);
  if (typeof from === 'string' && from) query = query.gte('period_start', from);
  if (typeof to === 'string' && to) query = query.lte('period_end', to);

  const { data, error } = await query;
  if (error) return fail(res, 500, error.message);
  return ok(res, data);
}
