import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { ok, fail } from '../_lib/respond';
import { parseBody } from '../_lib/validate';
import { getAdapter, TRIPLETEX_SAMPLE_REPORT } from '../_lib/accounting';
import type { AccountingProvider } from '../_lib/accounting';

const syncSchema = z.object({
  connection_id: z.string().uuid(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Optional provider-native report to normalize. When omitted, Phase 0 falls back
  // to the built-in Tripletex sample so "Sync now" demonstrates the full path.
  report: z.unknown().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const body = parseBody(res, syncSchema, req.body);
  if (!body) return;

  const { data: connection, error: cErr } = await supabaseAdmin
    .from('accounting_connections')
    .select('id, participant_id, provider, status, participants(cohort)')
    .eq('id', body.connection_id)
    .single();
  if (cErr || !connection) return fail(res, 404, 'Connection not found.');
  if (connection.status === 'revoked') return fail(res, 409, 'This connection has been revoked.');

  const period = { start: body.period_start, end: body.period_end };
  const provider = connection.provider as AccountingProvider;

  let usedSample = false;
  let report = body.report;
  if (report === undefined) {
    if (provider !== 'tripletex') {
      return fail(res, 400, `No report provided and no sample available for provider "${provider}".`);
    }
    report = TRIPLETEX_SAMPLE_REPORT;
    usedSample = true;
  }

  let normalized;
  try {
    normalized = getAdapter(provider).normalize(report, period);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Normalization failed.';
    await supabaseAdmin
      .from('accounting_connections')
      .update({ status: 'error', last_error: message })
      .eq('id', connection.id);
    return fail(res, 502, message);
  }

  const cohort = (connection.participants as unknown as { cohort: string } | null)?.cohort ?? null;

  const { data: snapshot, error: sErr } = await supabaseAdmin
    .from('pnl_snapshots')
    .upsert(
      {
        connection_id: connection.id,
        participant_id: connection.participant_id,
        cohort,
        provider,
        currency: normalized.currency,
        period_start: normalized.periodStart,
        period_end: normalized.periodEnd,
        revenue: normalized.revenue,
        cogs: normalized.cogs,
        payroll: normalized.payroll,
        other_opex: normalized.otherOpex,
        net_result: normalized.netResult,
        raw_json: normalized.raw,
        source: usedSample ? 'manual' : 'sync',
      },
      { onConflict: 'connection_id,period_start,period_end' },
    )
    .select()
    .single();
  if (sErr) return fail(res, 500, sErr.message);

  await supabaseAdmin
    .from('accounting_connections')
    .update({ last_synced_at: new Date().toISOString(), last_error: null, status: 'active' })
    .eq('id', connection.id);

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: caller.userId,
    action: 'accounting_synced',
    entity_type: 'pnl_snapshot',
    entity_id: snapshot.id,
  });

  return ok(res, snapshot, 201);
}
