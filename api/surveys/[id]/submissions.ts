import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../../_lib/auth';
import { supabaseAdmin } from '../../_lib/supabaseAdmin';
import { ok, fail } from '../../_lib/respond';
import { parseBody } from '../../_lib/validate';

const submitSchema = z.object({
  answers: z.array(z.object({ question_id: z.string().uuid(), answer_text: z.string() })).min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id: surveyId } = req.query;
  if (typeof surveyId !== 'string') return fail(res, 400, 'Missing survey id.');

  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const { data, error } = await supabaseAdmin
      .from('survey_submissions')
      .select('id, participant_id, submitted_at, survey_answers(question_id, answer_text), participants(company_name, profiles(name))')
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false });
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['participant']);
    if (!caller) return;

    const body = parseBody(res, submitSchema, req.body);
    if (!body) return;

    const { data: participant, error: pError } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('profile_id', caller.userId)
      .single();
    if (pError || !participant) return fail(res, 404, 'Participant record not found.');

    const { data: submission, error } = await supabaseAdmin
      .from('survey_submissions')
      .insert({ survey_id: surveyId, participant_id: participant.id })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    const { error: answersError } = await supabaseAdmin
      .from('survey_answers')
      .insert(body.answers.map((a) => ({ ...a, submission_id: submission.id })));
    if (answersError) return fail(res, 500, answersError.message);

    return ok(res, submission, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
