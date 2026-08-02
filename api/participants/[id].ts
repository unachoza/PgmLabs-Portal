import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const updateSchema = z.object({
  cohort: z.string().min(1).optional(),
  company_name: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  status: z.enum(['active', 'graduated', 'paused', 'withdrawn']).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing participant id.');

  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;

    const { data, error } = await supabaseAdmin
      .from('participants')
      .select('id, profile_id, cohort, company_name, industry, joined_at, status, profiles(name, email)')
      .eq('id', id)
      .single();
    if (error || !data) return fail(res, 404, 'Participant not found.');

    if (caller.role === 'participant' && data.profile_id !== caller.userId) {
      return fail(res, 403, 'You can only view your own record.');
    }
    return ok(res, data);
  }

  if (req.method === 'PATCH') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, updateSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin.from('participants').update(body).eq('id', id).select().single();
    if (error) return fail(res, 500, error.message);

    await supabaseAdmin
      .from('audit_logs')
      .insert({ actor_id: caller.userId, action: 'participant_updated', entity_type: 'participant', entity_id: id });

    return ok(res, data);
  }

  if (req.method === 'DELETE') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const { error } = await supabaseAdmin.from('participants').delete().eq('id', id);
    if (error) return fail(res, 500, error.message);

    await supabaseAdmin
      .from('audit_logs')
      .insert({ actor_id: caller.userId, action: 'participant_deleted', entity_type: 'participant', entity_id: id });

    return ok(res, { id });
  }

  return fail(res, 405, 'Method not allowed.');
}
