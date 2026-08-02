import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  achieved_on: z.string().nullable().optional(),
});

async function assertOwnedOrAdmin(caller: { userId: string; role: string }, milestoneId: string) {
  if (caller.role === 'admin') return true;

  const { data: milestone } = await supabaseAdmin
    .from('participant_milestones')
    .select('participant_id, participants(profile_id)')
    .eq('id', milestoneId)
    .single();
  const ownerProfileId = (milestone?.participants as unknown as { profile_id: string } | null)?.profile_id;
  return ownerProfileId === caller.userId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing milestone id.');

  if (req.method === 'PATCH') {
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;
    if (!(await assertOwnedOrAdmin(caller, id))) return fail(res, 403, 'You can only edit your own milestones.');

    const body = parseBody(res, updateSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('participant_milestones')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'DELETE') {
    const caller = await requireRole(req, res, ['admin', 'participant']);
    if (!caller) return;
    if (!(await assertOwnedOrAdmin(caller, id))) return fail(res, 403, 'You can only delete your own milestones.');

    const { error } = await supabaseAdmin.from('participant_milestones').delete().eq('id', id);
    if (error) return fail(res, 500, error.message);
    return ok(res, { id });
  }

  return fail(res, 405, 'Method not allowed.');
}
