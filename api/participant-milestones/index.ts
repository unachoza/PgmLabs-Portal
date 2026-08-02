import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  achieved_on: z.string().optional(),
  participant_id: z.string().uuid().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;

    let query = supabaseAdmin.from('participant_milestones').select('*').order('achieved_on', { ascending: false });

    if (caller.role === 'participant') {
      const { data: participant } = await supabaseAdmin
        .from('participants')
        .select('id')
        .eq('profile_id', caller.userId)
        .single();
      if (!participant) return ok(res, []);
      query = query.eq('participant_id', participant.id);
    } else {
      const { participant_id } = req.query;
      if (typeof participant_id === 'string' && participant_id) query = query.eq('participant_id', participant_id);
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    let participantId = body.participant_id;
    if (caller.role === 'participant') {
      const { data: participant, error: pError } = await supabaseAdmin
        .from('participants')
        .select('id')
        .eq('profile_id', caller.userId)
        .single();
      if (pError || !participant) return fail(res, 404, 'Participant record not found.');
      participantId = participant.id;
    }
    if (!participantId) return fail(res, 400, 'participant_id is required.');

    const { data, error } = await supabaseAdmin
      .from('participant_milestones')
      .insert({ participant_id: participantId, title: body.title, description: body.description ?? null, achieved_on: body.achieved_on ?? null })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    return ok(res, data, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
