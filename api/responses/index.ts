import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { ok, fail } from '../_lib/respond';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const { data, error } = await supabaseAdmin
    .from('responses')
    .select(
      'id, checkin_id, participant_id, payload_json, submitted_at, response_tags(tag), participants(company_name, cohort, profiles(name))',
    )
    .order('submitted_at', { ascending: false });

  if (error) return fail(res, 500, error.message);
  return ok(res, data);
}
