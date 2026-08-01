import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { ok, fail } from '../_lib/respond';
import { parseBody } from '../_lib/validate';

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  audience_segment: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .select('*')
      .order('created_by', { ascending: false });
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .insert({ ...body, created_by: caller.userId, status: 'draft' })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return ok(res, data, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
