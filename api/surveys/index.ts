import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { ok, fail } from '../_lib/respond';
import { parseBody } from '../_lib/validate';

const questionSchema = z.object({
  question_text: z.string().min(1),
  question_type: z.enum(['text', 'number', 'select', 'multiselect', 'boolean']),
  required: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  recurrence: z.enum(['none', 'weekly', 'monthly', 'quarterly']).default('none'),
  questions: z.array(questionSchema).min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;

    let query = supabaseAdmin
      .from('surveys')
      .select('id, title, description, created_by, created_at, is_active, recurrence')
      .order('created_at', { ascending: false });

    if (caller.role === 'participant') query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    const { data: survey, error } = await supabaseAdmin
      .from('surveys')
      .insert({
        title: body.title,
        description: body.description ?? null,
        created_by: caller.userId,
        recurrence: body.recurrence,
      })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    const { error: qError } = await supabaseAdmin
      .from('survey_questions')
      .insert(body.questions.map((q) => ({ ...q, survey_id: survey.id })));
    if (qError) return fail(res, 500, qError.message);

    return ok(res, survey, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
