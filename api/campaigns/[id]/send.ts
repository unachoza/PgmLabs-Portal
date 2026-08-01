import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../../_lib/auth';
import { supabaseAdmin } from '../../_lib/supabaseAdmin';
import { ok, fail } from '../../_lib/respond';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const { id } = req.query;
  if (typeof id !== 'string') return fail(res, 400, 'Missing campaign id.');

  const { data, error } = await supabaseAdmin
    .from('marketing_campaigns')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return fail(res, 500, error.message);

  await supabaseAdmin
    .from('audit_logs')
    .insert({ actor_id: caller.userId, action: 'campaign_sent', entity_type: 'marketing_campaign', entity_id: id });

  return ok(res, data);
}
