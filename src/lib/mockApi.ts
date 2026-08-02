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
import type { FunderUpdate, HousekeepingResponseValue, KnowledgeBaseArticle, ProgramEvent, ProgramKpi, ResponseTag, Survey } from './types';
import { surveyEligibility } from './recurrence';

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

  if (path.startsWith('/participant-milestones')) {
    const profile = currentProfile();
    const [, query] = path.split('?');
    const filterParticipantId = query ? new URLSearchParams(query).get('participant_id') : null;

    let milestones = mockState.participantMilestones;
    if (profile?.role === 'participant') {
      const participant = getMockParticipantForCurrentSession();
      milestones = participant ? milestones.filter((m) => m.participant_id === participant.id) : [];
    } else if (filterParticipantId) {
      milestones = milestones.filter((m) => m.participant_id === filterParticipantId);
    }
    return json({ success: true, data: getMockResponse(milestones), error: null });
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

  if (path === '/program-events') {
    const withKpis = mockState.programEvents.map((event) => ({
      ...event,
      kpis: mockState.programKpis.filter((kpi) => kpi.panel === 'cohort_achievements' && kpi.event_id === event.id),
    }));
    return json({ success: true, data: getMockResponse(withKpis), error: null });
  }

  if (path.startsWith('/program-kpis')) {
    const [, query] = path.split('?');
    const panel = query ? new URLSearchParams(query).get('panel') : null;
    const filtered = panel ? mockState.programKpis.filter((kpi) => kpi.panel === panel) : mockState.programKpis;
    return json({ success: true, data: getMockResponse(filtered), error: null });
  }

  if (path === '/survey-submissions') {
    const profile = currentProfile();
    let submissions = mockState.surveySubmissions;
    if (profile?.role === 'participant') {
      const participant = getMockParticipantForCurrentSession();
      submissions = participant ? submissions.filter((s) => s.participant_id === participant.id) : [];
    }

    const enriched = submissions.map((s) => {
      const survey = mockState.surveys.find((sv) => sv.id === s.survey_id);
      const participant = mockState.participants.find((p) => p.id === s.participant_id);
      return {
        ...s,
        surveys: survey ? { title: survey.title } : undefined,
        participants: participant
          ? { company_name: participant.company_name, cohort: participant.cohort, profiles: { name: participant.profiles?.name ?? '' } }
          : undefined,
        survey_answers: s.answers.map((a, i) => {
          const question = survey?.questions?.find((q) => q.id === a.question_id);
          return {
            id: `${s.id}-answer-${i}`,
            question_id: a.question_id,
            answer_text: a.answer_text,
            survey_questions: question ? { question_text: question.question_text, sort_order: question.sort_order } : undefined,
          };
        }),
      };
    });

    enriched.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    return json({ success: true, data: getMockResponse(enriched), error: null });
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

  if (path === '/participant-milestones') {
    const profile = currentProfile();
    const participant = getMockParticipantForCurrentSession();
    const participantId = profile?.role === 'admin' ? String(body?.participant_id ?? '') : participant?.id;
    if (!participantId) return json({ success: false, data: null, error: 'No participant profile found for this mock session.' }, 404);

    const now = new Date().toISOString();
    const milestone = {
      id: `mock-milestone-${Date.now()}`,
      participant_id: participantId,
      title: String(body?.title ?? ''),
      description: typeof body?.description === 'string' ? body.description : null,
      achieved_on: typeof body?.achieved_on === 'string' ? body.achieved_on : null,
      created_at: now,
      updated_at: now,
    };
    mockState.participantMilestones.push(milestone);
    return json({ success: true, data: getMockResponse(milestone), error: null }, 201);
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

  if (path === '/program-events') {
    const now = new Date().toISOString();
    const event: ProgramEvent = {
      id: `mock-event-${Date.now()}`,
      title: String(body?.title ?? ''),
      description: typeof body?.description === 'string' ? body.description : null,
      event_type: (body?.event_type as ProgramEvent['event_type']) ?? 'upcoming',
      event_date: String(body?.event_date ?? now.slice(0, 10)),
      cohort: typeof body?.cohort === 'string' ? body.cohort : null,
      location: typeof body?.location === 'string' ? body.location : null,
      created_by: currentProfile()?.id ?? 'mock-admin',
      created_at: now,
      updated_at: now,
    };
    mockState.programEvents.push(event);
    return json({ success: true, data: getMockResponse(event), error: null });
  }

  if (path === '/program-kpis') {
    const kpi: ProgramKpi = {
      id: `mock-kpi-${Date.now()}`,
      panel: (body?.panel as ProgramKpi['panel']) ?? 'cohort_achievements',
      event_id: typeof body?.event_id === 'string' ? body.event_id : null,
      label: String(body?.label ?? ''),
      value: String(body?.value ?? ''),
      period_label: typeof body?.period_label === 'string' ? body.period_label : null,
      sort_order: Number(body?.sort_order ?? mockState.programKpis.length),
      created_by: currentProfile()?.id ?? 'mock-admin',
      created_at: new Date().toISOString(),
    };
    mockState.programKpis.push(kpi);
    return json({ success: true, data: getMockResponse(kpi), error: null });
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

  if (path.startsWith('/surveys/') && path.endsWith('/submissions')) {
    const surveyId = path.split('/')[2];
    const participant = getMockParticipantForCurrentSession();
    if (!participant) return json({ success: false, data: null, error: 'No participant profile found for this mock session.' }, 404);

    const survey = mockState.surveys.find((sv) => sv.id === surveyId);
    const lastSubmittedAt = mockState.surveySubmissions
      .filter((s) => s.survey_id === surveyId && s.participant_id === participant.id)
      .map((s) => s.submitted_at)
      .sort()
      .at(-1);
    const eligibility = surveyEligibility(survey?.recurrence ?? 'none', lastSubmittedAt);
    if (eligibility.status === 'locked_forever') {
      return json(
        { success: false, data: null, error: `You've already submitted "${survey?.title ?? 'this survey'}". Contact your program admin if you need to update your response.` },
        409,
      );
    }
    if (eligibility.status === 'locked_until') {
      return json(
        {
          success: false,
          data: null,
          error: `You can resubmit "${survey?.title ?? 'this survey'}" again on ${new Date(eligibility.availableAt).toLocaleDateString()}. Contact your program admin if you need to update your last response sooner.`,
        },
        409,
      );
    }

    const answers = Array.isArray(body?.answers) ? (body.answers as { question_id: string; answer_text: string }[]) : [];
    const submission = {
      id: `mock-submission-${Date.now()}`,
      survey_id: surveyId,
      participant_id: participant.id,
      submitted_at: new Date().toISOString(),
      answers,
    };
    mockState.surveySubmissions.push(submission);
    return json({ success: true, data: getMockResponse(submission), error: null }, 201);
  }

  if (path.includes('/respond') || path.includes('/submissions') || path.endsWith('/send')) {
    return json({ success: true, data: null, error: null });
  }

  return notFound(path);
}

function handlePatch(path: string, body: Record<string, unknown> | null) {
  if (path === '/participants/me') {
    const participant = getMockParticipantForCurrentSession();
    if (!participant) return json({ success: false, data: null, error: 'No participant profile found for this mock session.' }, 404);

    const editable = ['company_name', 'industry', 'company_website', 'company_description', 'address_line1', 'city', 'state', 'zip_code', 'current_challenges'] as const;
    for (const key of editable) {
      if (body && key in body) (participant as unknown as Record<string, unknown>)[key] = body[key] ?? null;
    }
    return json({ success: true, data: getMockResponse(participant), error: null });
  }

  if (path.startsWith('/participant-milestones/')) {
    const id = path.split('/')[2];
    const milestone = mockState.participantMilestones.find((m) => m.id === id);
    if (!milestone) return notFound(path);
    if (typeof body?.title === 'string') milestone.title = body.title;
    if ('description' in (body ?? {})) milestone.description = (body?.description as string | null) ?? null;
    if ('achieved_on' in (body ?? {})) milestone.achieved_on = (body?.achieved_on as string | null) ?? null;
    milestone.updated_at = new Date().toISOString();
    return json({ success: true, data: getMockResponse(milestone), error: null });
  }

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

  if (path.startsWith('/program-events/')) {
    const id = path.split('/')[2];
    const event = mockState.programEvents.find((item) => item.id === id);
    if (!event) return notFound(path);
    if (typeof body?.title === 'string') event.title = body.title;
    if (typeof body?.description === 'string') event.description = body.description;
    if (body?.event_type === 'upcoming' || body?.event_type === 'past') event.event_type = body.event_type;
    if (typeof body?.event_date === 'string') event.event_date = body.event_date;
    if (typeof body?.cohort === 'string') event.cohort = body.cohort;
    if (typeof body?.location === 'string') event.location = body.location;
    event.updated_at = new Date().toISOString();
    return json({ success: true, data: getMockResponse(event), error: null });
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

  if (path.startsWith('/participant-milestones/')) {
    const id = path.split('/')[2];
    mockState.participantMilestones = mockState.participantMilestones.filter((m) => m.id !== id);
    return json({ success: true, data: null, error: null });
  }

  if (path.startsWith('/program-events/')) {
    const id = path.split('/')[2];
    mockState.programEvents = mockState.programEvents.filter((event) => event.id !== id);
    mockState.programKpis = mockState.programKpis.filter((kpi) => kpi.event_id !== id);
    return json({ success: true, data: null, error: null });
  }

  if (path.startsWith('/program-kpis/')) {
    const id = path.split('/')[2];
    mockState.programKpis = mockState.programKpis.filter((kpi) => kpi.id !== id);
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

    const path = (parsed.pathname.slice('/api'.length) || '/') + parsed.search;
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
