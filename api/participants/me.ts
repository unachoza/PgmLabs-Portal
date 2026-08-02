import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const SELECT =
  'id, profile_id, cohort, company_name, industry, joined_at, status, address_line1, city, state, zip_code, company_website, company_description, current_challenges, profiles(name, email)';

// Fields a participant may edit about themselves. cohort/status/joined_at
// stay admin-only — those are program operations, not profile details.
const updateSchema = z.object({
  company_name: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  company_website: z.string().nullable().optional(),
  company_description: z.string().nullable().optional(),
  address_line1: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip_code: z.string().nullable().optional(),
  current_challenges: z.string().nullable().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const caller = await requireRole(req, res, ['participant']);
  if (!caller) return;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('participants').select(SELECT).eq('profile_id', caller.userId).single();
    if (error || !data) return fail(res, 404, 'Participant record not found.');
    return ok(res, data);
  }

  if (req.method === 'PATCH') {
    const body = parseBody(res, updateSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('participants')
      .update(body)
      .eq('profile_id', caller.userId)
      .select(SELECT)
      .single();
    if (error || !data) return fail(res, 500, error?.message ?? 'Could not update profile.');

    return ok(res, data);
  }

  return fail(res, 405, 'Method not allowed.');
}
