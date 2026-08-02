import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing KPI id.');

  const { error } = await supabaseAdmin.from('program_kpis').delete().eq('id', id);
  if (error) return fail(res, 500, error.message);
  return ok(res, { id });
}
