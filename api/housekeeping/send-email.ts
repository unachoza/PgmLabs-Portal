import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

// Log-only, like the existing funder-update/campaign "Send" actions — this
// does not call an external email provider. It records the outbound email in
// communication_logs so it shows up in the participant's history.
const sendSchema = z.object({
  participant_id: z.string().uuid(),
  subject: z.string().min(1),
  body: z.string().min(1),
  item_key: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const parsed = parseBody(res, sendSchema, req.body);
  if (!parsed) return;

  const { data: participant, error: participantError } = await supabaseAdmin
    .from('participants')
    .select('id, profiles(email)')
    .eq('id', parsed.participant_id)
    .single();
  if (participantError || !participant) return fail(res, 404, 'Participant not found.');

  const { data: log, error: logError } = await supabaseAdmin
    .from('communication_logs')
    .insert({
      entity_type: 'participant',
      entity_id: parsed.participant_id,
      channel: 'email',
      direction: 'outbound',
      subject: parsed.subject,
      body: parsed.body,
      created_by: caller.userId,
    })
    .select()
    .single();
  if (logError) return fail(res, 500, logError.message);

  await supabaseAdmin
    .from('audit_logs')
    .insert({ actor_id: caller.userId, action: 'housekeeping_email_logged', entity_type: 'participant', entity_id: parsed.participant_id });

  if (parsed.item_key) {
    await supabaseAdmin
      .from('housekeeping_responses')
      .upsert(
        { item_key: parsed.item_key, response: 'yes', responded_by: caller.userId, responded_at: new Date().toISOString() },
        { onConflict: 'item_key' },
      );
  }

  return ok(res, log, 201);
}
