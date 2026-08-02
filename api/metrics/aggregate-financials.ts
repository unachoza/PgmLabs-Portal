import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';

// Rolls company-level pnl_snapshots up into aggregate metrics_snapshots, the ONLY
// financial surface funders can reach. Keeps the funder dashboard on its existing
// aggregate-only /api/metrics route — no new funder data path is created.
const FINANCIAL_KEYS = [
  'cohort_revenue',
  'cohort_net_result',
  'companies_profitable',
  'companies_burning_cash',
];

type Row = {
  cohort: string | null;
  period_start: string;
  period_end: string;
  currency: string;
  revenue: number;
  net_result: number;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const { data: snapshots, error } = await supabaseAdmin
    .from('pnl_snapshots')
    .select('cohort, period_start, period_end, currency, revenue, net_result');
  if (error) return fail(res, 500, error.message);

  // Group by cohort + period + currency. Currency is part of the key on purpose:
  // summing revenue across NOK and USD would be meaningless, so mixed-currency
  // cohorts produce one aggregate row per currency rather than a bogus total.
  const groups = new Map<string, Row[]>();
  for (const s of (snapshots ?? []) as Row[]) {
    const key = `${s.cohort ?? ''}|${s.period_start}|${s.period_end}|${s.currency}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  const rows: {
    cohort: string | null;
    period_start: string;
    period_end: string;
    metric_key: string;
    metric_value: number;
  }[] = [];

  for (const items of groups.values()) {
    const { cohort, period_start, period_end } = items[0];
    const revenue = items.reduce((sum, r) => sum + Number(r.revenue), 0);
    const netResult = items.reduce((sum, r) => sum + Number(r.net_result), 0);
    const profitable = items.filter((r) => Number(r.net_result) >= 0).length;
    const burning = items.filter((r) => Number(r.net_result) < 0).length;
    const base = { cohort, period_start, period_end };
    rows.push(
      { ...base, metric_key: 'cohort_revenue', metric_value: revenue },
      { ...base, metric_key: 'cohort_net_result', metric_value: netResult },
      { ...base, metric_key: 'companies_profitable', metric_value: profitable },
      { ...base, metric_key: 'companies_burning_cash', metric_value: burning },
    );
  }

  // Recompute from scratch: clear prior financial aggregates, then insert fresh.
  const { error: delError } = await supabaseAdmin
    .from('metrics_snapshots')
    .delete()
    .in('metric_key', FINANCIAL_KEYS);
  if (delError) return fail(res, 500, delError.message);

  if (rows.length > 0) {
    const { error: insError } = await supabaseAdmin.from('metrics_snapshots').insert(rows);
    if (insError) return fail(res, 500, insError.message);
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: caller.userId,
    action: 'financials_aggregated',
    entity_type: 'metrics_snapshot',
    entity_id: null,
  });

  return ok(res, { groups: groups.size, metrics_written: rows.length });
}
