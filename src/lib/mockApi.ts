import {
  addMockParticipant,
  computeMockHousekeepingFeed,
  getMockParticipantForCurrentSession,
  getMockProfileForCurrentSession,
  getMockResponse,
  isMockModeEnabled,
  mockState,
  recordMockHousekeepingResponse,
  registerMockUser,
} from './mockRuntime';
import type { FunderUpdate, HousekeepingResponseValue, KnowledgeBaseArticle, ResponseTag, Survey } from './types';

type MockQuestionType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean';

type Envelope<T> = { success: boolean; data: T | null; error: string | null };

let installed = false;

function json<T>(body: Envelope<T>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function text(body: string, status = 200, contentType = 'text/plain; charset=utf-8') {
  return new Response(body, {
    status,
    headers: { 'Content-Type': contentType },
  });
}

function notFound(path: string) {
  return json({ success: false, data: null, error: `Mock API route not found: ${path}` }, 404);
}

function getBody(init?: RequestInit) {
  if (!init?.body || typeof init.body !== 'string') return null;
  try {
    return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function currentProfile() {
  return getMockProfileForCurrentSession();
}

function requireProfile(path: string) {
  const profile = currentProfile();
  if (!profile) return json({ success: false, data: null, error: `Mock auth required for ${path}.` }, 401);
  return profile;
}

function handleGet(path: string) {
  if (path === '/auth/me') {
    const profile = currentProfile();
    if (!profile) return json({ success: false, data: null, error: 'No mock session found.' }, 401);
    return json({ success: true, data: getMockResponse(profile), error: null });
  }

  if (path === '/participants') {
    return json({ success: true, data: getMockResponse(mockState.participants), error: null });
  }

  if (path === '/participants/me') {
    const participant = getMockParticipantForCurrentSession();
    if (!participant) return json({ success: false, data: null, error: 'No participant profile found for this mock session.' }, 404);
    return json({ success: true, data: getMockResponse(participant), error: null });
  }

  if (path === '/checkins') {
    return json({ success: true, data: getMockResponse(mockState.checkins), error: null });
  }

  if (path === '/surveys') {
    const profile = currentProfile();
    const surveys = profile?.role === 'admin' ? mockState.surveys : mockState.surveys.filter((survey) => survey.is_active);
    return json({ success: true, data: getMockResponse(surveys), error: null });
  }

  if (path.startsWith('/surveys/')) {
    const id = path.split('/')[2];
    const survey = mockState.surveys.find((candidate) => candidate.id === id);
    if (!survey) return notFound(path);
    return json({ success: true, data: getMockResponse(survey), error: null });
  }

  if (path === '/responses') {
    return json({ success: true, data: getMockResponse(mockState.responses), error: null });
  }

  if (path === '/metrics') {
    return json({ success: true, data: getMockResponse(mockState.metrics), error: null });
  }

  if (path === '/funder-updates') {
    return json({ success: true, data: getMockResponse(mockState.funderUpdates), error: null });
  }

  if (path === '/campaigns') {
    return json({ success: true, data: getMockResponse(mockState.campaigns), error: null });
  }

  if (path === '/knowledge-base') {
    return json({ success: true, data: getMockResponse(mockState.knowledgeBase), error: null });
  }

  if (path === '/housekeeping') {
    return json({ success: true, data: computeMockHousekeepingFeed(), error: null });
  }

  if (path === '/accounting/connections') {
    return json({ success: true, data: getMockResponse(mockState.connections), error: null });
  }

  if (path === '/accounting/snapshots') {
    return json({ success: true, data: getMockResponse(mockState.snapshots), error: null });
  }

  if (path === '/export/participants') {
    const rows = [
      'name,email,cohort,company_name,industry,status',
      ...mockState.participants.map((participant) =>
        [
          participant.profiles?.name ?? '',
          participant.profiles?.email ?? '',
          participant.cohort,
          participant.company_name ?? '',
          participant.industry ?? '',
          participant.status,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      ),
    ];
    return text(rows.join('\n'), 200, 'text/csv; charset=utf-8');
  }

  return notFound(path);
}

function handlePost(path: string, body: Record<string, unknown> | null) {
  if (path === '/participants') {
    const profileOrResponse = requireProfile(path);
    if (profileOrResponse instanceof Response) return profileOrResponse;
    const participant = addMockParticipant({
      name: String(body?.name ?? ''),
      email: String(body?.email ?? ''),
      cohort: String(body?.cohort ?? ''),
      company_name: String(body?.company_name ?? ''),
      industry: String(body?.industry ?? ''),
    });
    return json({ success: true, data: getMockResponse(participant), error: null });
  }

  if (path === '/auth/signup') {
    try {
      const profile = registerMockUser({
        name: String(body?.name ?? ''),
        email: String(body?.email ?? ''),
        password: String(body?.password ?? ''),
        role: (body?.role as 'participant' | 'funder') ?? 'participant',
        cohort: typeof body?.cohort === 'string' ? body.cohort : undefined,
      });
      return json({ success: true, data: getMockResponse({ id: profile.id, email: profile.email, role: profile.role }), error: null });
    } catch (error) {
      return json({ success: false, data: null, error: error instanceof Error ? error.message : 'Unable to create account.' }, 400);
    }
  }

  if (path === '/checkins') {
    const participantIds = Array.isArray(body?.participant_ids) ? (body.participant_ids as string[]) : [];
    const subject = String(body?.subject ?? '');
    const message = String(body?.message ?? '');
    const dueAt = typeof body?.due_at === 'string' ? body.due_at : null;
    const createdAt = new Date().toISOString();

    for (const participantId of participantIds) {
      mockState.checkins.unshift({
        id: `mock-checkin-${Date.now()}-${participantId}`,
        participant_id: participantId,
        subject,
        message,
        sent_by: currentProfile()?.id ?? 'mock-admin',
        sent_at: createdAt,
        due_at: dueAt,
        status: 'sent',
      });
    }
    return json({ success: true, data: null, error: null });
  }

  if (path === '/surveys') {
    const surveyId = `mock-survey-${Date.now()}`;
    const questions = Array.isArray(body?.questions)
      ? (body.questions as Array<Record<string, unknown>>).map((question, index) => ({
        id: `mock-question-${Date.now()}-${index}`,
        survey_id: surveyId,
        question_text: String(question.question_text ?? ''),
        question_type: (question.question_type as MockQuestionType) ?? 'text',
        required: Boolean(question.required),
        sort_order: Number(question.sort_order ?? index),
      }))
      : [];

    const survey: Survey = {
      id: surveyId,
      title: String(body?.title ?? ''),
      description: String(body?.description ?? ''),
      created_by: currentProfile()?.id ?? 'mock-admin',
      created_at: new Date().toISOString(),
      is_active: false,
      recurrence: (body?.recurrence as Survey['recurrence']) ?? 'none',
      questions,
    };
    mockState.surveys.unshift(survey);
    return json({ success: true, data: getMockResponse(survey), error: null });
  }

  if (path === '/funder-updates') {
    const update: FunderUpdate = {
      id: `mock-update-${Date.now()}`,
      title: String(body?.title ?? ''),
      summary: String(body?.summary ?? ''),
      audience: String(body?.audience ?? ''),
      sent_by: currentProfile()?.id ?? 'mock-admin',
      sent_at: new Date().toISOString(),
      follow_up_status: 'none',
    };
    mockState.funderUpdates.unshift(update);
    return json({ success: true, data: getMockResponse(update), error: null });
  }

  if (path === '/campaigns') {
    const campaign = {
      id: `mock-campaign-${Date.now()}`,
      title: String(body?.title ?? ''),
      content: String(body?.content ?? ''),
      audience_segment: String(body?.audience_segment ?? ''),
      created_by: currentProfile()?.id ?? 'mock-admin',
      sent_at: null,
      status: 'draft' as const,
    };
    mockState.campaigns.unshift(campaign);
    return json({ success: true, data: getMockResponse(campaign), error: null });
  }

  if (path === '/knowledge-base') {
    const now = new Date().toISOString();
    const article: KnowledgeBaseArticle = {
      id: `mock-kb-${Date.now()}`,
      category: String(body?.category ?? ''),
      title: String(body?.title ?? ''),
      content: typeof body?.content === 'string' ? body.content : null,
      links: Array.isArray(body?.links) ? (body.links as KnowledgeBaseArticle['links']) : [],
      created_by: currentProfile()?.id ?? 'mock-admin',
      updated_by: null,
      created_at: now,
      updated_at: now,
    };
    mockState.knowledgeBase.push(article);
    return json({ success: true, data: getMockResponse(article), error: null });
  }

  if (path === '/accounting/connections') {
    const profileOrResponse = requireProfile(path);
    if (profileOrResponse instanceof Response) return profileOrResponse;
    const participant = mockState.participants.find((candidate) => candidate.id === String(body?.participant_id ?? '')) ?? null;
    const connection = {
      id: `mock-connection-${Date.now()}`,
      participant_id: String(body?.participant_id ?? ''),
      provider: (body?.provider as 'tripletex' | 'qbo' | 'xero' | 'wave') ?? 'tripletex',
      external_company_id: null,
      external_company_name: String(body?.external_company_name ?? ''),
      status: 'pending' as const,
      scope: 'read:accounts,read:invoices',
      connected_at: null,
      last_synced_at: null,
      last_error: null,
      created_at: new Date().toISOString(),
      participants: participant
        ? { cohort: participant.cohort, company_name: participant.company_name, profiles: { name: participant.profiles?.name ?? '' } }
        : undefined,
    };
    mockState.connections.unshift(connection);
    return json({ success: true, data: getMockResponse(connection), error: null });
  }

  if (path === '/accounting/sync' || path === '/metrics/aggregate-financials') {
    return json({ success: true, data: null, error: null });
  }

  if (path === '/housekeeping/respond') {
    const itemKey = String(body?.item_key ?? '');
    const response = body?.response as HousekeepingResponseValue;
    recordMockHousekeepingResponse(itemKey, response);
    return json({ success: true, data: { item_key: itemKey, response }, error: null });
  }

  if (path === '/housekeeping/send-email') {
    const itemKey = typeof body?.item_key === 'string' ? body.item_key : null;
    if (itemKey) recordMockHousekeepingResponse(itemKey, 'yes');
    return json({ success: true, data: null, error: null }, 201);
  }

  if (path.includes('/respond') || path.includes('/submissions') || path.endsWith('/send')) {
    return json({ success: true, data: null, error: null });
  }

  return notFound(path);
}

function handlePatch(path: string, body: Record<string, unknown> | null) {
  if (path.startsWith('/funder-updates/')) {
    const id = path.split('/')[2];
    const update = mockState.funderUpdates.find((item) => item.id === id);
    if (!update) return notFound(path);
    update.follow_up_status = (body?.follow_up_status as FunderUpdate['follow_up_status']) ?? update.follow_up_status;
    return json({ success: true, data: getMockResponse(update), error: null });
  }

  if (path.startsWith('/surveys/')) {
    const id = path.split('/')[2];
    const survey = mockState.surveys.find((item) => item.id === id);
    if (!survey) return notFound(path);
    if (typeof body?.is_active === 'boolean') survey.is_active = body.is_active;
    return json({ success: true, data: getMockResponse(survey), error: null });
  }

  if (path.startsWith('/knowledge-base/')) {
    const id = path.split('/')[2];
    const article = mockState.knowledgeBase.find((item) => item.id === id);
    if (!article) return notFound(path);
    if (typeof body?.category === 'string') article.category = body.category;
    if (typeof body?.title === 'string') article.title = body.title;
    if (typeof body?.content === 'string') article.content = body.content;
    if (Array.isArray(body?.links)) article.links = body.links as typeof article.links;
    article.updated_by = currentProfile()?.id ?? 'mock-admin';
    article.updated_at = new Date().toISOString();
    return json({ success: true, data: getMockResponse(article), error: null });
  }

  return notFound(path);
}

function handlePut(path: string, body: Record<string, unknown> | null) {
  if (path.startsWith('/responses/')) {
    const id = path.split('/')[2];
    const response = mockState.responses.find((item) => item.id === id);
    if (!response) return notFound(path);
    const tags = Array.isArray(body?.tags) ? (body.tags as ResponseTag[]) : [];
    response.response_tags = tags.map((tag) => ({ tag }));
    return json({ success: true, data: getMockResponse(response), error: null });
  }

  return notFound(path);
}

function handleDelete(path: string) {
  if (path.startsWith('/surveys/')) {
    const id = path.split('/')[2];
    mockState.surveys = mockState.surveys.filter((survey) => survey.id !== id);
    return json({ success: true, data: null, error: null });
  }

  if (path.startsWith('/participants/')) {
    const id = path.split('/')[2];
    mockState.participants = mockState.participants.filter((participant) => participant.id !== id);
    return json({ success: true, data: null, error: null });
  }

  if (path.startsWith('/knowledge-base/')) {
    const id = path.split('/')[2];
    mockState.knowledgeBase = mockState.knowledgeBase.filter((article) => article.id !== id);
    return json({ success: true, data: null, error: null });
  }

  return notFound(path);
}

export function installMockApi() {
  if (!isMockModeEnabled() || installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const parsed = new URL(url, window.location.origin);
    if (!parsed.pathname.startsWith('/api')) {
      return originalFetch(input, init);
    }

    const path = parsed.pathname.slice('/api'.length) || '/';
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const body = getBody(init);

    if (method === 'GET') return handleGet(path);
    if (method === 'POST') return handlePost(path, body);
    if (method === 'PATCH') return handlePatch(path, body);
    if (method === 'PUT') return handlePut(path, body);
    if (method === 'DELETE') return handleDelete(path);

    return notFound(path);
  };
}
