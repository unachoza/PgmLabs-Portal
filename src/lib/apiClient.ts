import { supabase } from './supabaseClient';

type Envelope<T> = { success: boolean; data: T | null; error: string | null };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const raw = await res.text();
  let json: Envelope<T>;

  try {
    json = raw ? (JSON.parse(raw) as Envelope<T>) : { success: false, data: null, error: `Empty response from ${path}.` };
  } catch {
    throw new Error(raw ? `Unexpected response from ${path}: ${raw.slice(0, 200)}` : `Empty response from ${path}.`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
