import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

const updateSchema = z.object({
  category: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  links: z.array(linkSchema).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing article id.');

  if (req.method === 'PATCH') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, updateSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('knowledge_base_articles')
      .update({ ...body, updated_by: caller.userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'DELETE') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const { error } = await supabaseAdmin.from('knowledge_base_articles').delete().eq('id', id);
    if (error) return fail(res, 500, error.message);
    return ok(res, { id });
  }

  return fail(res, 405, 'Method not allowed.');
}
