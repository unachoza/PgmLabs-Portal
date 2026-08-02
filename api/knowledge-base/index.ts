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

const createSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  links: z.array(linkSchema).default([]),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const { data, error } = await supabaseAdmin
      .from('knowledge_base_articles')
      .select('*')
      .order('category', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) return fail(res, 500, error.message);
    return ok(res, data);
  }

  if (req.method === 'POST') {
    const caller = await requireRole(req, res, ['admin']);
    if (!caller) return;

    const body = parseBody(res, createSchema, req.body);
    if (!body) return;

    const { data, error } = await supabaseAdmin
      .from('knowledge_base_articles')
      .insert({ ...body, created_by: caller.userId })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    return ok(res, data, 201);
  }

  return fail(res, 405, 'Method not allowed.');
}
