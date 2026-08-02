import type {
  AccountingConnection,
  Checkin,
  FunderUpdate,
  KnowledgeBaseArticle,
  MarketingCampaign,
  MetricSnapshot,
  Participant,
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
};

export type MockResponseRow = {
  id: string;
  submitted_at: string;
  payload_json: Record<string, unknown>;
  response_tags: { tag: ResponseTag }[];
  participants: { company_name: string | null; cohort: string; profiles: { name: string } } | null;
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
      submitted_at: '2026-07-24T14:10:00.000Z',
      payload_json: { revenue_band: '50k-100k', jobs_created: 2, challenges: 'Hiring speed' },
      response_tags: [{ tag: 'growth' }, { tag: 'hiring' }],
      participants: { company_name: 'Northstar Health', cohort: 'Cohort A', profiles: { name: 'Amara Okafor' } },
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
