import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../../_lib/auth';
import { supabaseAdmin } from '../../_lib/supabaseAdmin';
import { ok, fail } from '../../_lib/respond';
import { parseBody } from '../../_lib/validate';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing survey id.');

  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;

    const { data: survey, error } = await supabaseAdmin.from('surveys').select('*').eq('id', id).single();
    if (error || !survey) return fail(res, 404, 'Survey not found.');

    const { data: questions, error: qError } = await supabaseAdmin
      .from('survey_questions')
      .select('*')
      .eq('survey_id', id)
      .order('sort_order');
    if (qError) return fail(res, 500, qError.message);

    return ok(res, { ...survey, questions });
  }

  if (req.method === 'PATCH') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, updateSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin.from('surveys').update(body).eq('id', id).select().single();
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'DELETE') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const { error } = await supabaseAdmin.from('surveys').delete().eq('id', id);
    if (error) return fail(res, 500, error.message);
    return ok(res, { id });
  }

  return fail(res, 405, 'Method not allowed.');
}
