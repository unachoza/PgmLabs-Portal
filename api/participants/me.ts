import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['participant']);
  if (!caller) return;

  const { data, error } = await supabaseAdmin
    .from('participants')
    .select('id, profile_id, cohort, company_name, industry, joined_at, status, profiles(name, email)')
    .eq('profile_id', caller.userId)
    .single();

  if (error || !data) return fail(res, 404, 'Participant record not found.');
  return ok(res, data);
}
