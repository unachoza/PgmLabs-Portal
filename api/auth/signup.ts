import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { fail, ok } from '../_lib/respond.js';
import { parseBody } from '../_lib/validate.js';

const signupSchema = z
    .object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(['participant', 'funder']),
        cohort: z.string().min(1).optional(),
    })
    .superRefine((value, ctx) => {
        if (value.role === 'participant' && !value.cohort) {
            ctx.addIssue({ code: 'custom', path: ['cohort'], message: 'Cohort is required for participants.' });
        }
    });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');

    const body = parseBody(res, signupSchema, req.body);
    if (!body) return;

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
    });

    if (createError || !created.user) return fail(res, 400, createError?.message ?? 'Could not create account.');

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: created.user.id,
        name: body.name,
        email: body.email,
        role: body.role,
    });

    if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        return fail(res, 500, profileError.message);
    }

    if (body.role === 'participant') {
        const { error: participantError } = await supabaseAdmin.from('participants').insert({
            profile_id: created.user.id,
            cohort: body.cohort,
            company_name: null,
            industry: null,
        });

        if (participantError) {
            await supabaseAdmin.from('profiles').delete().eq('id', created.user.id);
            await supabaseAdmin.auth.admin.deleteUser(created.user.id);
            return fail(res, 500, participantError.message);
        }
    }

    return ok(res, { id: created.user.id, email: body.email, role: body.role }, 201);
}