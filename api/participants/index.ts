import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  cohort: z.string().min(1),
  company_name: z.string().optional(),
  industry: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const { search, cohort } = req.query;
    let query = supabaseAdmin
      .from('participants')
      .select('id, profile_id, cohort, company_name, industry, joined_at, status, profiles(name, email)')
      .order('joined_at', { ascending: false });

    if (typeof cohort === 'string' && cohort) query = query.eq('cohort', cohort);

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);

    const filtered =
      typeof search === 'string' && search
        ? data.filter((p) => {
            const name = (p.profiles as unknown as { name: string } | null)?.name ?? '';
            return (
              name.toLowerCase().includes(search.toLowerCase()) ||
              (p.company_name ?? '').toLowerCase().includes(search.toLowerCase())
            );
          })
        : data;

    return ok(res, filtered);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    // Admin creates the auth user first (invite flow), then the participant record.
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      email_confirm: true,
      password: crypto.randomUUID(),
    });
    if (createError || !created.user) return fail(res, 400, createError?.message ?? 'Could not create account.');

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: created.user.id, name: body.name, email: body.email, role: 'participant' });
    if (profileError) return fail(res, 500, profileError.message);

    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .insert({
        profile_id: created.user.id,
        cohort: body.cohort,
        company_name: body.company_name ?? null,
        industry: body.industry ?? null,
      })
      .select()
      .single();
    if (participantError) return fail(res, 500, participantError.message);

    await supabaseAdmin
      .from('audit_logs')
      .insert({ actor_id: caller.userId, action: 'participant_created', entity_type: 'participant', entity_id: participant.id });

    return ok(res, participant, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
