import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireRole } from '../../_lib/auth';
import { supabaseAdmin } from '../../_lib/supabaseAdmin';
import { ok, fail } from '../../_lib/respond';
import { parseBody } from '../../_lib/validate';

const tagSchema = z.object({
  tags: z.array(z.enum(['growth', 'hiring', 'funding', 'risk', 'other'])),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing response id.');

  const body = parseBody(res, tagSchema, req.body);
  if (!body) return;

  await supabaseAdmin.from('response_tags').delete().eq('response_id', id);

  if (body.tags.length > 0) {
    const { error } = await supabaseAdmin
      .from('response_tags')
      .insert(body.tags.map((tag) => ({ response_id: id, tag })));
    if (error) return fail(res, 500, error.message);
  }

  return ok(res, { id, tags: body.tags });
}
