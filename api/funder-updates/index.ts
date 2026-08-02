import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const createSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  audience: z.string().min(1),
  follow_up_status: z.enum(['none', 'pending', 'complete']).default('none'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin', 'funder']);
    if (!caller) return;

    const { data, error } = await supabaseAdmin.from('funder_updates').select('*').order('sent_at', { ascending: false });
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('funder_updates')
      .insert({ ...body, sent_by: caller.userId })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    await supabaseAdmin
      .from('communication_logs')
      .insert({
        entity_type: 'funder',
        entity_id: data.id,
        channel: 'in_app',
        direction: 'outbound',
        subject: data.title,
        body: data.summary,
        created_by: caller.userId,
      });
    await supabaseAdmin
      .from('audit_logs')
      .insert({ actor_id: caller.userId, action: 'funder_update_sent', entity_type: 'funder_update', entity_id: data.id });

    return ok(res, data, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
