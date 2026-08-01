import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabaseAdmin';
import { fail } from './respond';

export type UserRole = 'participant' | 'admin' | 'funder';

export type AuthedCaller = {
  userId: string;
  email: string;
  role: UserRole;
};

/**
 * Verifies the bearer JWT from the Authorization header and loads the
 * caller's profile/role. Returns null (and writes the 401/403 response
 * itself) on failure so call sites can `if (!caller) return;`.
 */
export async function requireRole(
  req: VercelRequest,
  res: VercelResponse,
  allowed: UserRole[],
): Promise<AuthedCaller | null> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) {
    fail(res, 401, 'Missing Authorization bearer token.');
    return null;
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    fail(res, 401, 'Invalid or expired session.');
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile) {
    fail(res, 401, 'No profile found for this account.');
    return null;
  }

  if (!allowed.includes(profile.role as UserRole)) {
    fail(res, 403, `This action requires one of: ${allowed.join(', ')}.`);
    return null;
  }

  return { userId: profile.id, email: profile.email, role: profile.role as UserRole };
}
