import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';
import { ok, fail } from '../../_lib/respond.js';
import { parseBody } from '../../_lib/validate.js';

const respondSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['participant']);
  if (!caller) return;

  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing check-in id.');

  const body = parseBody(res, respondSchema, req.body);
  if (!body) return;

  const { data: checkin, error: checkinError } = await supabaseAdmin
    .from('checkins')
    .select('id, participant_id, participants!inner(profile_id)')
    .eq('id', id)
    .single();
  if (checkinError || !checkin) return fail(res, 404, 'Check-in not found.');

  const ownerProfileId = (checkin.participants as unknown as { profile_id: string }).profile_id;
  if (ownerProfileId !== caller.userId) return fail(res, 403, 'This check-in does not belong to you.');

  const { data: response, error: responseError } = await supabaseAdmin
    .from('responses')
    .insert({ checkin_id: id, participant_id: checkin.participant_id, payload_json: body.payload })
    .select()
    .single();
  if (responseError) return fail(res, 500, responseError.message);

  await supabaseAdmin.from('checkins').update({ status: 'responded' }).eq('id', id);

  return ok(res, response, 201);
}
