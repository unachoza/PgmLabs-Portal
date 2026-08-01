import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../../_lib/auth';
import { supabaseAdmin } from '../../_lib/supabaseAdmin';
import { ok, fail } from '../../_lib/respond';
import { parseBody } from '../../_lib/validate';

const createSchema = z.object({
  participant_id: z.string().uuid(),
  provider: z.enum(['tripletex', 'qbo', 'xero', 'wave']),
  external_company_name: z.string().min(1),
  external_company_id: z.string().optional(),
});

const CONNECTION_COLS =
  'id, participant_id, provider, external_company_id, external_company_name, status, scope, connected_at, last_synced_at, last_error, created_at';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Admins see every connection; participants see only their own. Never returns tokens.
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;

    let query = supabaseAdmin
      .from('accounting_connections')
      .select(`${CONNECTION_COLS}, participants(cohort, company_name, profiles(name))`)
      .order('created_at', { ascending: false });

    if (caller.role === 'participant') {
      const { data: me } = await supabaseAdmin
        .from('participants')
        .select('id')
        .eq('profile_id', caller.userId)
        .single();
      if (!me) return ok(res, []);
      query = query.eq('participant_id', me.id);
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    // Phase 0: admin registers a connection manually (no OAuth dance yet). The
    // consent ledger still records the grant so the audit trail is real from day one.
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    const { data: participant, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('id, cohort')
      .eq('id', body.participant_id)
      .single();
    if (pErr || !participant) return fail(res, 404, 'Participant not found.');

    const { data: connection, error } = await supabaseAdmin
      .from('accounting_connections')
      .insert({
        participant_id: body.participant_id,
        provider: body.provider,
        external_company_name: body.external_company_name,
        external_company_id: body.external_company_id ?? null,
        status: 'active',
        connected_at: new Date().toISOString(),
      })
      .select(CONNECTION_COLS)
      .single();
    if (error) return fail(res, 500, error.message);

    await supabaseAdmin.from('accounting_consents').insert({
      participant_id: body.participant_id,
      connection_id: connection.id,
      action: 'granted',
      scope: 'read_only:pnl',
      agreement_version: 'phase0-manual-v1',
      actor_id: caller.userId,
    });

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: caller.userId,
      action: 'accounting_connected',
      entity_type: 'accounting_connection',
      entity_id: connection.id,
    });

    return ok(res, connection, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
