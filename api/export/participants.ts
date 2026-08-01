import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { fail } from '../_lib/respond';

function toCsvValue(value: unknown): string {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const { data, error } = await supabaseAdmin
    .from('participants')
    .select('id, cohort, company_name, industry, joined_at, status, profiles(name, email)');
  if (error) return fail(res, 500, error.message);

  const header = ['id', 'name', 'email', 'cohort', 'company_name', 'industry', 'joined_at', 'status'];
  const rows = data.map((p) => {
    const profile = p.profiles as unknown as { name: string; email: string } | null;
    return [p.id, profile?.name, profile?.email, p.cohort, p.company_name, p.industry, p.joined_at, p.status]
      .map(toCsvValue)
      .join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');

  await supabaseAdmin
    .from('audit_logs')
    .insert({ actor_id: caller.userId, action: 'report_exported', entity_type: 'participants_csv', entity_id: null });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="participants.csv"');
  return res.status(200).send(csv);
}
