import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const createSchema = z.object({
  participant_ids: z.array(z.string().uuid()).min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  due_at: z.string().datetime().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;

    let query = supabaseAdmin
      .from('checkins')
      .select('id, participant_id, subject, message, sent_by, sent_at, due_at, status')
      .order('sent_at', { ascending: false });

    if (caller.role === 'participant') {
      const { data: participant } = await supabaseAdmin
        .from('participants')
        .select('id')
        .eq('profile_id', caller.userId)
        .single();
      if (!participant) return ok(res, []);
      query = query.eq('participant_id', participant.id);
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    const rows = body.participant_ids.map((participant_id) => ({
      participant_id,
      subject: body.subject,
      message: body.message,
      sent_by: caller.userId,
      due_at: body.due_at ?? null,
      status: 'sent' as const,
    }));

    const { data, error } = await supabaseAdmin.from('checkins').insert(rows).select();
    if (error) return fail(res, 500, error.message);

    await supabaseAdmin.from('audit_logs').insert(
      data.map((c) => ({ actor_id: caller.userId, action: 'checkin_sent', entity_type: 'checkin', entity_id: c.id })),
    );

    return ok(res, data, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
