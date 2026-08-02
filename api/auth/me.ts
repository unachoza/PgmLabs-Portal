import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['participant', 'admin', 'funder']);
  if (!caller) return;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', caller.userId)
    .single();

  if (error || !profile) return fail(res, 404, 'Profile not found.');
  return ok(res, profile);
}
