import type {
  AccountingConnection,
  Checkin,
  FunderUpdate,
  HousekeepingFeed,
  HousekeepingItem,
  HousekeepingResponseValue,
  KnowledgeBaseArticle,
  MarketingCampaign,
  MetricSnapshot,
  Participant,
  ProgramEvent,
  ProgramKpi,
  Profile,
  PnLSnapshot,
  ResponseTag,
  Survey,
} from './types';

type MockSession = {
  access_token: string;
  user: { id: string; email: string };
};

type MockUserSeed = {
  email: string;
  password: string;
  profile: Profile;
};

type MockState = {
  participants: Participant[];
  checkins: Checkin[];
  surveys: Survey[];
  responses: MockResponseRow[];
  funderUpdates: FunderUpdate[];
  campaigns: MarketingCampaign[];
  metrics: MetricSnapshot[];
  connections: AccountingConnection[];
  snapshots: PnLSnapshot[];
  knowledgeBase: KnowledgeBaseArticle[];
  housekeepingResponses: MockHousekeepingResponse[];
  programEvents: ProgramEvent[];
  programKpis: ProgramKpi[];
};

export type MockResponseRow = {
  id: string;
  participant_id: string;
  submitted_at: string;
  payload_json: Record<string, unknown>;
  response_tags: { tag: ResponseTag }[];
  participants: { company_name: string | null; cohort: string; profiles: { name: string; email: string } } | null;
};

export type MockHousekeepingResponse = {
  item_key: string;
  response: HousekeepingResponseValue;
  responded_at: string;
};

const MOCK_SESSION_KEY = 'pgmlabs.mock-session';

const MOCK_USERS: MockUserSeed[] = [
  {
    email: 'admin@accelerator.dev',
    password: 'Passw0rd!',
    profile: { id: 'mock-admin', name: 'Avery Carter', email: 'admin@accelerator.dev', role: 'admin' },
  },
  {
    email: 'funder@accelerator.dev',
    password: 'Passw0rd!',
    profile: { id: 'mock-funder', name: 'Morgan Lee', email: 'funder@accelerator.dev', role: 'funder' },
  },
  {
    email: 'amara.okafor@participant.dev',
    password: 'Passw0rd!',
    profile: { id: 'mock-participant-1-profile', name: 'Amara Okafor', email: 'amara.okafor@participant.dev', role: 'participant' },
  },
];

const profileByEmail = new Map(MOCK_USERS.map((user) => [user.email, user.profile] as const));
const mockListeners = new Set<(event: string, session: MockSession | null) => void>();

function makeParticipant(id: string, profile: Profile, cohort: string, company_name: string | null, industry: string | null, status: Participant['status']): Participant {
  return {
    id,
    profile_id: profile.id,
    cohort,
    company_name,
    industry,
    joined_at: '2026-06-01T00:00:00.000Z',
    status,
    profiles: { name: profile.name, email: profile.email },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const mockState: MockState = {
  participants: [
    makeParticipant('mock-participant-1', MOCK_USERS[2].profile, 'Cohort A', 'Northstar Health', 'Health', 'active'),
    makeParticipant('mock-participant-2', { id: 'mock-participant-2-profile', name: 'Diego Alvarez', email: 'diego.alvarez@participant.dev', role: 'participant' }, 'Cohort A', 'Blue Trail Labs', 'Climate', 'active'),
    makeParticipant('mock-participant-3', { id: 'mock-participant-3-profile', name: 'Priya Singh', email: 'priya.singh@participant.dev', role: 'participant' }, 'Cohort B', 'Solar Grid', 'Energy', 'paused'),
  ],
  checkins: [
    {
      id: 'mock-checkin-1',
      participant_id: 'mock-participant-1',
      subject: 'Weekly progress check-in',
      message: 'Share wins, blockers, and anything we should escalate.',
      sent_by: 'mock-admin',
      sent_at: '2026-07-15T15:00:00.000Z',
      due_at: '2026-07-22T15:00:00.000Z',
      status: 'responded',
    },
    {
      id: 'mock-checkin-2',
      participant_id: 'mock-participant-2',
      subject: 'Mid-month update',
      message: 'What changed this month?',
      sent_by: 'mock-admin',
      sent_at: '2026-07-20T15:00:00.000Z',
      due_at: '2026-07-27T15:00:00.000Z',
      status: 'overdue',
    },
  ],
  surveys: [
    {
      id: 'mock-survey-1',
      title: 'Monthly Growth Pulse',
      description: 'Quick snapshot of traction, hiring, and support needs.',
      created_by: 'mock-admin',
      created_at: '2026-07-01T12:00:00.000Z',
      is_active: true,
      recurrence: 'monthly',
      questions: [
        {
          id: 'mock-question-1',
          survey_id: 'mock-survey-1',
          question_text: 'How many jobs were created this month?',
          question_type: 'number',
          required: true,
          sort_order: 0,
        },
        {
          id: 'mock-question-2',
          survey_id: 'mock-survey-1',
          question_text: 'What is your biggest blocker?',
          question_type: 'text',
          required: true,
          sort_order: 1,
        },
      ],
    },
    {
      id: 'mock-survey-2',
      title: 'Founder Confidence Check',
      description: 'Short pulse survey for active participants.',
      created_by: 'mock-admin',
      created_at: '2026-06-20T12:00:00.000Z',
      is_active: false,
      recurrence: 'none',
      questions: [],
    },
  ],
  responses: [
    {
      id: 'mock-response-1',
      participant_id: 'mock-participant-1',
      submitted_at: '2026-07-24T14:10:00.000Z',
      payload_json: { revenue_band: '50k-100k', jobs_created: 2, challenges: 'Hiring speed' },
      response_tags: [{ tag: 'growth' }, { tag: 'hiring' }],
      participants: { company_name: 'Northstar Health', cohort: 'Cohort A', profiles: { name: 'Amara Okafor', email: 'amara.okafor@participant.dev' } },
    },
    {
      id: 'mock-response-2',
      participant_id: 'mock-participant-2',
      submitted_at: '2026-07-28T09:30:00.000Z',
      payload_json: { revenue_band: '0-50k', jobs_created: 0, challenges: 'Losing our largest customer next quarter — revenue at risk' },
      response_tags: [{ tag: 'risk' }],
      participants: { company_name: 'Blue Trail Labs', cohort: 'Cohort A', profiles: { name: 'Diego Alvarez', email: 'diego.alvarez@participant.dev' } },
    },
  ],
  funderUpdates: [
    {
      id: 'mock-update-1',
      title: 'Cohort A is accelerating',
      summary: 'Three teams closed new customer pilots and one company hired their first sales lead.',
      audience: 'all_funders',
      sent_by: 'mock-admin',
      sent_at: '2026-07-18T10:00:00.000Z',
      follow_up_status: 'none',
    },
    {
      id: 'mock-update-2',
      title: 'July financial snapshot',
      summary: 'Normalized P&L data is ready for funder review.',
      audience: 'funder@accelerator.dev',
      sent_by: 'mock-admin',
      sent_at: '2026-07-29T10:00:00.000Z',
      follow_up_status: 'pending',
    },
  ],
  campaigns: [
    {
      id: 'mock-campaign-1',
      title: 'Fall cohort interest',
      content: 'We are now accepting applications for the next cohort.',
      audience_segment: 'prospects',
      created_by: 'mock-admin',
      sent_at: null,
      status: 'draft',
    },
  ],
  metrics: [
    { id: 'mock-metric-1', cohort: 'Cohort A', period_start: '2026-07-01', period_end: '2026-07-31', metric_key: 'active_participants', metric_value: 2, captured_at: '2026-07-31T23:59:00.000Z' },
    { id: 'mock-metric-2', cohort: 'Cohort A', period_start: '2026-07-01', period_end: '2026-07-31', metric_key: 'jobs_created', metric_value: 8, captured_at: '2026-07-31T23:59:00.000Z' },
    { id: 'mock-metric-3', cohort: 'Cohort A', period_start: '2026-07-01', period_end: '2026-07-31', metric_key: 'capital_raised_usd', metric_value: 150000, captured_at: '2026-07-31T23:59:00.000Z' },
    { id: 'mock-metric-4', cohort: 'Cohort B', period_start: '2026-07-01', period_end: '2026-07-31', metric_key: 'active_participants', metric_value: 1, captured_at: '2026-07-31T23:59:00.000Z' },
    { id: 'mock-metric-5', cohort: 'Cohort B', period_start: '2026-07-01', period_end: '2026-07-31', metric_key: 'jobs_created', metric_value: 3, captured_at: '2026-07-31T23:59:00.000Z' },
    { id: 'mock-metric-6', cohort: 'Cohort B', period_start: '2026-07-01', period_end: '2026-07-31', metric_key: 'cohort_revenue', metric_value: 98000, captured_at: '2026-07-31T23:59:00.000Z' },
    { id: 'mock-metric-7', cohort: 'Cohort B', period_start: '2026-07-01', period_end: '2026-07-31', metric_key: 'cohort_net_result', metric_value: -12000, captured_at: '2026-07-31T23:59:00.000Z' },
    { id: 'mock-metric-8', cohort: 'Cohort B', period_start: '2026-07-01', period_end: '2026-07-31', metric_key: 'companies_burning_cash', metric_value: 1, captured_at: '2026-07-31T23:59:00.000Z' },
  ],
  connections: [
    {
      id: 'mock-connection-1',
      participant_id: 'mock-participant-1',
      provider: 'tripletex',
      external_company_id: 'ext-northstar',
      external_company_name: 'Northstar Health AS',
      status: 'active',
      scope: 'read:accounts,read:invoices',
      connected_at: '2026-07-10T09:00:00.000Z',
      last_synced_at: '2026-07-31T09:15:00.000Z',
      last_error: null,
      created_at: '2026-07-10T09:00:00.000Z',
      participants: { cohort: 'Cohort A', company_name: 'Northstar Health', profiles: { name: 'Amara Okafor' } },
    },
    {
      id: 'mock-connection-2',
      participant_id: 'mock-participant-2',
      provider: 'xero',
      external_company_id: 'ext-blue-trail',
      external_company_name: 'Blue Trail Labs Ltd',
      status: 'active',
      scope: 'read:accounts,read:invoices',
      connected_at: '2026-07-12T09:00:00.000Z',
      last_synced_at: '2026-07-31T09:20:00.000Z',
      last_error: null,
      created_at: '2026-07-12T09:00:00.000Z',
      participants: { cohort: 'Cohort A', company_name: 'Blue Trail Labs', profiles: { name: 'Diego Alvarez' } },
    },
  ],
  snapshots: [
    {
      id: 'mock-snapshot-1',
      connection_id: 'mock-connection-1',
      participant_id: 'mock-participant-1',
      cohort: 'Cohort A',
      provider: 'tripletex',
      currency: 'USD',
      period_start: '2026-07-01',
      period_end: '2026-07-31',
      revenue: 128000,
      cogs: 47000,
      payroll: 42000,
      other_opex: 18000,
      net_result: 21000,
      source: 'manual',
      pulled_at: '2026-07-31T09:15:00.000Z',
      accounting_connections: { external_company_name: 'Northstar Health AS' },
      participants: { company_name: 'Northstar Health', profiles: { name: 'Amara Okafor' } },
    },
    {
      id: 'mock-snapshot-2',
      connection_id: 'mock-connection-2',
      participant_id: 'mock-participant-2',
      cohort: 'Cohort A',
      provider: 'xero',
      currency: 'USD',
      period_start: '2026-07-01',
      period_end: '2026-07-31',
      revenue: 86000,
      cogs: 30000,
      payroll: 28000,
      other_opex: 15000,
      net_result: 13000,
      source: 'manual',
      pulled_at: '2026-07-31T09:20:00.000Z',
      accounting_connections: { external_company_name: 'Blue Trail Labs Ltd' },
      participants: { company_name: 'Blue Trail Labs', profiles: { name: 'Diego Alvarez' } },
    },
  ],
  knowledgeBase: [
    {
      id: 'mock-kb-1',
      category: 'Strategy for Alex at Conferences',
      title: 'FAQ Questions Across Conferences',
      content: [
        '1. What challenge are you addressing? (Why does this issue matter now? What problem exists)',
        '2. What is your approach or innovation? (What makes your framework, model, research, or program different)',
        '3. What evidence shows it works? (Data, evaluation, outcomes, participant stories)',
        '4. What will participants actually learn? (3–5 learning objectives or takeaways)',
        '5. What practical tools will attendees leave with? (templates, worksheets, implementation guides)',
        '6. How will the session engage participants? (Discussion, workshop, exercises, case studies)',
        '7. How does this advance equity or systems change? (Inclusion, community voice, equitable outcomes, policy impact or policy implications)',
        '8. Why is this timely? (Why should this conversation happen this year?)',
        '9. Why are you credible on this topic (bio and success story)',
      ].join('\n'),
      links: [],
      created_by: 'mock-admin',
      updated_by: null,
      created_at: '2026-07-01T12:00:00.000Z',
      updated_at: '2026-07-01T12:00:00.000Z',
    },
    {
      id: 'mock-kb-2',
      category: 'Strategy for Alex at Conferences',
      title: 'Deck Ideas',
      content: [
        'What future are we preparing communities for?',
        'What problems are traditional entrepreneurship ecosystems failing to solve?',
        'What is the Program Labs methodology?',
        'How does the methodology work?',
        'Where has it been implemented?',
        'What evidence demonstrates impact?',
        'How can organizations adapt the framework?',
        'What tools do attendees receive?',
        'How do funders, ecosystem builders, and practitioners use it?',
        'What comes next?',
      ].join('\n'),
      links: [],
      created_by: 'mock-admin',
      updated_by: null,
      created_at: '2026-07-01T12:05:00.000Z',
      updated_at: '2026-07-01T12:05:00.000Z',
    },
    {
      id: 'mock-kb-3',
      category: 'Strategy for Alex at Conferences',
      title: 'National Conference Strategy',
      content: 'Reference links for identifying and submitting to national conferences.',
      links: [
        { label: 'List of national conferences', url: 'https://docs.google.com/spreadsheets/d/1MC1_xkTKkujX0DVMr13fX7j7R3IegkcJsu8_-wqft5s/edit?gid=0#gid=0' },
        { label: 'Submit proposal today', url: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jBWA57bSEUeH_iNHkb7y_5LEhaEuqfpGqQPwyUuGI-FUNEVVQklRWE9JQldIOTA5R0kwU1AxTE5TVS4u&origin=Invitation&channel=0' },
        { label: 'The Forum 2027 (NAWB)', url: 'https://www.nawb.org/the-forum-2027/' },
        { label: 'Submit Proposal (need login created)', url: 'https://whova.com/call_for_speakers/pdjptEzHL9d-zJ-vpHxU4n4a0ouJq2l%40jpwEqS05tFwPTz6C4KTR27TctRb31dHr/' },
        { label: 'Details for Funding', url: 'https://drive.google.com/file/d/1EfJjAsfdJkzxSXr7EpnYcAcGDy6XcEAx/view?usp=sharing' },
      ],
      created_by: 'mock-admin',
      updated_by: null,
      created_at: '2026-07-01T12:10:00.000Z',
      updated_at: '2026-07-01T12:10:00.000Z',
    },
  ],
  housekeepingResponses: [],
  programEvents: [
    {
      id: 'mock-event-1',
      title: 'Cohort 10 Graduation',
      description:
        'Inaugural SDCCE Accelerator cohort graduation — 10 companies completed the free 4-month program covering sales, finance, marketing, and business model, with small-group mentoring and weekly check-ins.',
      event_type: 'past',
      event_date: '2025-11-20',
      cohort: 'Cohort 10',
      location: 'Barrio Logan, San Diego',
      created_by: 'mock-admin',
      created_at: '2025-11-20T00:00:00.000Z',
      updated_at: '2025-11-20T00:00:00.000Z',
    },
    {
      id: 'mock-event-2',
      title: 'Cohort 11 Info Session',
      description:
        'Sample placeholder — replace with the real date. Applications open for the next free 4-month Accelerator cohort; info session covers eligibility, timeline, and what the program includes.',
      event_type: 'upcoming',
      event_date: '2026-09-10',
      cohort: 'Cohort 11',
      location: 'Barrio Logan, San Diego',
      created_by: 'mock-admin',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'mock-event-3',
      title: 'Quarterly Alumni Mixer',
      description:
        "Sample placeholder — replace with the real date. Networking mixer for Accelerator alumni, part of the Alumni Network's quarterly cadence.",
      event_type: 'upcoming',
      event_date: '2026-10-15',
      cohort: null,
      location: 'Barrio Logan, San Diego',
      created_by: 'mock-admin',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
    },
  ],
  programKpis: [
    { id: 'mock-kpi-1', panel: 'cohort_achievements', event_id: 'mock-event-1', label: 'Cohort Companies', value: '10', period_label: null, sort_order: 1, created_by: 'mock-admin', created_at: '2025-11-20T00:00:00.000Z' },
    { id: 'mock-kpi-2', panel: 'cohort_achievements', event_id: 'mock-event-1', label: 'Hours of 1-on-1 Coaching', value: '82', period_label: null, sort_order: 2, created_by: 'mock-admin', created_at: '2025-11-20T00:00:00.000Z' },
    { id: 'mock-kpi-3', panel: 'cohort_achievements', event_id: 'mock-event-1', label: 'Increased Revenue During Program', value: '30%', period_label: null, sort_order: 3, created_by: 'mock-admin', created_at: '2025-11-20T00:00:00.000Z' },
    { id: 'mock-kpi-4', panel: 'cohort_achievements', event_id: 'mock-event-1', label: 'Founders Reported Increase in Confidence', value: '100%', period_label: null, sort_order: 4, created_by: 'mock-admin', created_at: '2025-11-20T00:00:00.000Z' },
    { id: 'mock-kpi-5', panel: 'resource_center_activity', event_id: null, label: 'Technical Assistance Sessions', value: '61', period_label: 'May - Dec 2025', sort_order: 1, created_by: 'mock-admin', created_at: '2025-12-01T00:00:00.000Z' },
    { id: 'mock-kpi-6', panel: 'resource_center_activity', event_id: null, label: 'Community Workshops', value: '11', period_label: 'May - Dec 2025', sort_order: 2, created_by: 'mock-admin', created_at: '2025-12-01T00:00:00.000Z' },
    { id: 'mock-kpi-7', panel: 'resource_center_activity', event_id: null, label: 'Unique Visitors', value: '132', period_label: 'May - Dec 2025', sort_order: 3, created_by: 'mock-admin', created_at: '2025-12-01T00:00:00.000Z' },
    { id: 'mock-kpi-8', panel: 'resource_center_activity', event_id: null, label: 'Repeat Visitors', value: '26%', period_label: 'May - Dec 2025', sort_order: 4, created_by: 'mock-admin', created_at: '2025-12-01T00:00:00.000Z' },
    { id: 'mock-kpi-9', panel: 'resource_center_activity', event_id: null, label: 'Workshops Facilitated By Alumni', value: '9', period_label: 'May - Dec 2025', sort_order: 5, created_by: 'mock-admin', created_at: '2025-12-01T00:00:00.000Z' },
  ],
};

export function isMockModeEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE !== 'real';
}

export function getMockProfileByEmail(email: string): Profile | null {
  return profileByEmail.get(email) ?? null;
}

export function getStoredMockSession(): MockSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(MOCK_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockSession;
  } catch {
    window.localStorage.removeItem(MOCK_SESSION_KEY);
    return null;
  }
}

export function getMockProfileForCurrentSession(): Profile | null {
  const session = getStoredMockSession();
  if (!session) return null;
  return getMockProfileByEmail(session.user.email);
}

export function getMockParticipantForCurrentSession(): Participant | null {
  const profile = getMockProfileForCurrentSession();
  if (!profile || profile.role !== 'participant') return null;
  return mockState.participants.find((participant) => participant.profile_id === profile.id) ?? null;
}

function setStoredMockSession(session: MockSession | null) {
  if (typeof window === 'undefined') return;
  if (session) {
    window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(MOCK_SESSION_KEY);
  }
}

function emitMockSession(event: string, session: MockSession | null) {
  for (const listener of mockListeners) listener(event, session);
}

export function subscribeMockSession(listener: (event: string, session: MockSession | null) => void) {
  mockListeners.add(listener);
  return () => mockListeners.delete(listener);
}

export async function mockSignIn(email: string, password: string) {
  const user = MOCK_USERS.find((candidate) => candidate.email === email);
  if (!user || user.password !== password) {
    return { data: { session: null, user: null }, error: new Error('Invalid email or password.') };
  }

  const session: MockSession = {
    access_token: `mock-token-${user.profile.id}`,
    user: { id: user.profile.id, email: user.email },
  };

  setStoredMockSession(session);
  emitMockSession('SIGNED_IN', session);
  return { data: { session, user: user.profile }, error: null };
}

export async function mockSignOut() {
  setStoredMockSession(null);
  emitMockSession('SIGNED_OUT', null);
  return { error: null };
}

export function registerMockUser(input: {
  name: string;
  email: string;
  password: string;
  role: 'participant' | 'funder';
  cohort?: string;
}) {
  if (profileByEmail.has(input.email)) {
    throw new Error('A user with this email already exists.');
  }

  const profile: Profile = {
    id: `mock-profile-${Date.now()}`,
    name: input.name,
    email: input.email,
    role: input.role,
  };

  MOCK_USERS.push({ email: input.email, password: input.password, profile });
  profileByEmail.set(profile.email, profile);

  if (input.role === 'participant') {
    mockState.participants.unshift({
      id: `mock-participant-${Date.now()}`,
      profile_id: profile.id,
      cohort: input.cohort ?? 'Unassigned',
      company_name: null,
      industry: null,
      joined_at: new Date().toISOString(),
      status: 'active',
      profiles: { name: profile.name, email: profile.email },
    });
  }

  return profile;
}

export function getMockResponse<T>(value: T) {
  return clone(value);
}

export function addMockParticipant(input: { name: string; email: string; cohort: string; company_name: string; industry: string }) {
  const profile: Profile = {
    id: `mock-profile-${Date.now()}`,
    name: input.name,
    email: input.email,
    role: 'participant',
  };
  const participant: Participant = {
    id: `mock-participant-${Date.now()}`,
    profile_id: profile.id,
    cohort: input.cohort,
    company_name: input.company_name || null,
    industry: input.industry || null,
    joined_at: new Date().toISOString(),
    status: 'active',
    profiles: { name: profile.name, email: profile.email },
  };

  MOCK_USERS.push({ email: input.email, password: 'Passw0rd!', profile });
  profileByEmail.set(profile.email, profile);
  mockState.participants.unshift(participant);
  return participant;
}

const HOUSEKEEPING_SNOOZE_DAYS = 7;
const HOUSEKEEPING_INACTIVITY_DAYS = 30;

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function computeMockHousekeepingFeed(): HousekeepingFeed {
  const items: HousekeepingItem[] = [];

  for (const checkin of mockState.checkins) {
    if (checkin.status !== 'overdue') continue;
    const participant = mockState.participants.find((p) => p.id === checkin.participant_id);
    const name = participant?.profiles?.name ?? 'This participant';
    const label = participant?.company_name ? `${name} (${participant.company_name})` : name;
    const dueAt = checkin.due_at ?? checkin.sent_at;

    items.push({
      item_key: `overdue_checkin:${checkin.id}`,
      type: 'overdue_checkin',
      priority: 'high',
      title: `${label} — check-in overdue`,
      description: `"${checkin.subject}" was due ${new Date(dueAt).toLocaleDateString()} and hasn't been responded to. Send a follow-up email?`,
      emailable: Boolean(participant?.profiles?.email),
      participant_id: checkin.participant_id,
      participant_name: name,
      participant_email: participant?.profiles?.email ?? null,
      suggested_subject: `Following up: ${checkin.subject}`,
      suggested_body: `Hi ${name},\n\nJust checking in on "${checkin.subject}" — it looks like this is still outstanding. Let us know how things are going or if there's anything blocking you.\n\nThanks,\nProgram Labs`,
      since: dueAt,
    });
  }

  for (const response of mockState.responses) {
    if (!response.response_tags.some((t) => t.tag === 'risk')) continue;
    const participant = mockState.participants.find((p) => p.id === response.participant_id);
    const name = response.participants?.profiles?.name ?? participant?.profiles?.name ?? 'This participant';
    const companyName = response.participants?.company_name ?? participant?.company_name ?? null;
    const label = companyName ? `${name} (${companyName})` : name;
    const email = response.participants?.profiles?.email ?? participant?.profiles?.email ?? null;
    const challenge = typeof response.payload_json?.challenges === 'string' ? (response.payload_json.challenges as string) : null;

    items.push({
      item_key: `risk_response:${response.id}`,
      type: 'risk_response',
      priority: 'high',
      title: `${label} — flagged a risk`,
      description: challenge
        ? `Flagged in their latest response: "${challenge}". Send a follow-up email to check in?`
        : `Their latest response was tagged as a risk. Send a follow-up email to check in?`,
      emailable: Boolean(email),
      participant_id: response.participant_id,
      participant_name: name,
      participant_email: email,
      suggested_subject: 'Checking in after your last update',
      suggested_body: `Hi ${name},\n\nThanks for the update. We noticed you flagged a challenge and wanted to check in — is there anything the Program Labs team can help with?\n\nThanks,\nProgram Labs`,
      since: response.submitted_at,
    });
  }

  for (const update of mockState.funderUpdates) {
    if (update.follow_up_status !== 'pending') continue;
    items.push({
      item_key: `pending_funder_followup:${update.id}`,
      type: 'pending_funder_followup',
      priority: 'medium',
      title: `${update.audience} — follow-up pending`,
      description: `Funder update "${update.title}" is awaiting follow-up. Handle it from Funder Comms, then mark this resolved.`,
      emailable: false,
      participant_id: null,
      participant_name: null,
      participant_email: null,
      suggested_subject: null,
      suggested_body: null,
      since: update.sent_at,
    });
  }

  for (const participant of mockState.participants) {
    if (participant.status !== 'active') continue;
    const activityDates = [
      participant.joined_at,
      ...mockState.checkins.filter((c) => c.participant_id === participant.id).map((c) => c.sent_at),
      ...mockState.responses.filter((r) => r.participant_id === participant.id).map((r) => r.submitted_at),
    ];
    const lastActivity = activityDates.reduce((latest, iso) => (new Date(iso) > new Date(latest) ? iso : latest), activityDates[0]);
    if (daysAgo(lastActivity) < HOUSEKEEPING_INACTIVITY_DAYS) continue;

    const name = participant.profiles?.name ?? 'This participant';
    const label = participant.company_name ? `${name} (${participant.company_name})` : name;

    items.push({
      item_key: `inactive_participant:${participant.id}`,
      type: 'inactive_participant',
      priority: 'low',
      title: `${label} — gone quiet`,
      description: `No check-in or response in the last ${daysAgo(lastActivity)} days (since ${new Date(lastActivity).toLocaleDateString()}). Send a check-in nudge?`,
      emailable: Boolean(participant.profiles?.email),
      participant_id: participant.id,
      participant_name: name,
      participant_email: participant.profiles?.email ?? null,
      suggested_subject: 'Checking in',
      suggested_body: `Hi ${name},\n\nIt's been a little while since we've heard from you. How are things going${participant.company_name ? ` with ${participant.company_name}` : ''}? Let us know if you need any support.\n\nThanks,\nProgram Labs`,
      since: lastActivity,
    });
  }

  const snoozedKeys = new Set(
    mockState.housekeepingResponses.filter((r) => daysAgo(r.responded_at) < HOUSEKEEPING_SNOOZE_DAYS).map((r) => r.item_key),
  );
  const openItems = items.filter((item) => !snoozedKeys.has(item.item_key));

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  openItems.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || new Date(a.since).getTime() - new Date(b.since).getTime());

  return {
    summary: {
      overdue_checkins: openItems.filter((i) => i.type === 'overdue_checkin').length,
      risk_responses: openItems.filter((i) => i.type === 'risk_response').length,
      pending_funder_followups: openItems.filter((i) => i.type === 'pending_funder_followup').length,
      inactive_participants: openItems.filter((i) => i.type === 'inactive_participant').length,
      total_open: openItems.length,
    },
    items: openItems,
  };
}

export function recordMockHousekeepingResponse(itemKey: string, response: HousekeepingResponseValue) {
  const existing = mockState.housekeepingResponses.find((r) => r.item_key === itemKey);
  if (existing) {
    existing.response = response;
    existing.responded_at = new Date().toISOString();
  } else {
    mockState.housekeepingResponses.push({ item_key: itemKey, response, responded_at: new Date().toISOString() });
  }
}
