import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin', 'participant']);
  if (!caller) return;

  let query = supabaseAdmin
    .from('survey_submissions')
    .select(
      'id, survey_id, participant_id, submitted_at, surveys(title), participants(company_name, cohort, profiles(name)), survey_answers(id, question_id, answer_text, survey_questions(question_text, sort_order))',
    )
    .order('submitted_at', { ascending: false });

  if (caller.role === 'participant') {
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('profile_id', caller.userId)
      .single();
    if (!participant) return ok(res, []);
    query = query.eq('participant_id', participant.id);
  }

  const { data, error } = await query;
  if (error) return fail(res, 500, error.message);
  return ok(res, data);
}
