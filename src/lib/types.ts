export type UserRole = 'participant' | 'admin' | 'funder';

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Participant = {
  id: string;
  profile_id: string;
  cohort: string;
  company_name: string | null;
  industry: string | null;
  joined_at: string;
  status: 'active' | 'graduated' | 'paused' | 'withdrawn';
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  company_website: string | null;
  company_description: string | null;
  current_challenges: string | null;
  profiles?: { name: string; email: string };
};

export type ParticipantMilestone = {
  id: string;
  participant_id: string;
  title: string;
  description: string | null;
  achieved_on: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckinStatus = 'sent' | 'responded' | 'overdue';

export type Checkin = {
  id: string;
  participant_id: string;
  subject: string;
  message: string;
  sent_by: string;
  sent_at: string;
  due_at: string | null;
  status: CheckinStatus;
};

export type ResponseTag = 'growth' | 'hiring' | 'funding' | 'risk' | 'other';

export type CheckinResponse = {
  id: string;
  checkin_id: string;
  participant_id: string;
  payload_json: Record<string, unknown>;
  submitted_at: string;
  tags?: ResponseTag[];
};

export type Survey = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  is_active: boolean;
  recurrence: 'none' | 'weekly' | 'monthly' | 'quarterly';
  questions?: SurveyQuestion[];
};

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  sort_order: number;
};

export type SurveyAnswer = {
  id: string;
  question_id: string;
  answer_text: string;
  survey_questions?: { question_text: string; sort_order: number };
};

export type SurveySubmission = {
  id: string;
  survey_id: string;
  participant_id: string;
  submitted_at: string;
  surveys?: { title: string };
  participants?: { company_name: string | null; cohort: string; profiles: { name: string } };
  survey_answers?: SurveyAnswer[];
};

export type FunderUpdate = {
  id: string;
  title: string;
  summary: string;
  audience: string;
  sent_by: string;
  sent_at: string;
  follow_up_status: 'none' | 'pending' | 'complete';
};

export type MarketingCampaign = {
  id: string;
  title: string;
  content: string;
  audience_segment: string;
  created_by: string;
  sent_at: string | null;
  status: 'draft' | 'sent';
};

export type MetricSnapshot = {
  id: string;
  cohort: string | null;
  period_start: string | null;
  period_end: string | null;
  metric_key: string;
  metric_value: number;
  captured_at: string;
};

export type AccountingProvider = 'tripletex' | 'qbo' | 'xero' | 'wave';

export type ConnectionStatus = 'pending' | 'active' | 'revoked' | 'error';

export type AccountingConnection = {
  id: string;
  participant_id: string;
  provider: AccountingProvider;
  external_company_id: string | null;
  external_company_name: string | null;
  status: ConnectionStatus;
  scope: string;
  connected_at: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  participants?: { cohort: string; company_name: string | null; profiles?: { name: string } };
};

export type KnowledgeBaseLink = {
  label: string;
  url: string;
};

export type KnowledgeBaseArticle = {
  id: string;
  category: string;
  title: string;
  content: string | null;
  links: KnowledgeBaseLink[];
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type HousekeepingItemType = 'overdue_checkin' | 'risk_response' | 'pending_funder_followup' | 'inactive_participant';

export type HousekeepingResponseValue = 'yes' | 'no' | 'maybe';

export type HousekeepingItem = {
  item_key: string;
  type: HousekeepingItemType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  emailable: boolean;
  participant_id: string | null;
  participant_name: string | null;
  participant_email: string | null;
  suggested_subject: string | null;
  suggested_body: string | null;
  since: string;
};

export type HousekeepingSummary = {
  overdue_checkins: number;
  risk_responses: number;
  pending_funder_followups: number;
  inactive_participants: number;
  total_open: number;
};

export type HousekeepingFeed = {
  summary: HousekeepingSummary;
  items: HousekeepingItem[];
};

export type ProgramEventType = 'upcoming' | 'past';

export type ProgramKpiPanel = 'cohort_achievements' | 'resource_center_activity';

export type ProgramKpi = {
  id: string;
  panel: ProgramKpiPanel;
  event_id: string | null;
  label: string;
  value: string;
  period_label: string | null;
  sort_order: number;
  created_by: string;
  created_at: string;
};

export type ProgramEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: ProgramEventType;
  event_date: string;
  cohort: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  kpis?: ProgramKpi[];
};

export type PnLSnapshot = {
  id: string;
  connection_id: string;
  participant_id: string;
  cohort: string | null;
  provider: AccountingProvider;
  currency: string;
  period_start: string;
  period_end: string;
  revenue: number;
  cogs: number;
  payroll: number;
  other_opex: number;
  net_result: number;
  source: 'sync' | 'manual';
  pulled_at: string;
  accounting_connections?: { external_company_name: string | null };
  participants?: { company_name: string | null; profiles?: { name: string } };
};
